// ================================================================
// Tidsbrev.no — Netlify Background Function: Video-konvertering
// ================================================================
// Konverterer MOV/AVI-filer til MP4/H.264 for tidskapsell-ordrer.
// Kjøres som background function (opptil 15 min) trigget fra
// stripe-webhook.js etter vellykket betaling.
//
// Flyt:
//   1. Hent alle filer for ordren fra tidskapsell_files
//   2. For hver fil som er MOV/AVI:
//      a. Last ned fra Supabase Storage
//      b. Konverter til MP4/H.264 med FFmpeg
//      c. Last opp konvertert fil til Supabase Storage
//      d. Slett original fil fra Storage
//      e. Oppdater file_path og mime_type i tidskapsell_files
//   3. Logg resultater i admin_log
//
// Miljøvariabler:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// ================================================================

const { createClient } = require('@supabase/supabase-js');

const CONVERTIBLE_TYPES = ['video/quicktime', 'video/x-msvideo'];
const CONVERTIBLE_EXT = ['.mov', '.avi'];

function needsConversion(file) {
  if (CONVERTIBLE_TYPES.includes(file.mime_type)) return true;
  const ext = '.' + file.file_name.split('.').pop().toLowerCase();
  return CONVERTIBLE_EXT.includes(ext);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const { order_id } = JSON.parse(event.body || '{}');
  if (!order_id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Mangler order_id' }) };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log(`[convert-video] Starter konvertering for ordre ${order_id}`);

  const { data: files, error: filesErr } = await supabase
    .from('tidskapsell_files')
    .select('*')
    .eq('order_id', order_id);

  if (filesErr || !files) {
    console.error('[convert-video] Kunne ikke hente filer:', filesErr);
    return { statusCode: 500, body: JSON.stringify({ error: 'Kunne ikke hente filer' }) };
  }

  const toConvert = files.filter(needsConversion);

  if (toConvert.length === 0) {
    console.log('[convert-video] Ingen filer å konvertere');
    await supabase.from('admin_log').insert({
      action: 'video_conversion_skipped',
      order_id,
      note: `Ingen MOV/AVI-filer å konvertere (${files.length} filer totalt)`
    });
    return { statusCode: 200, body: JSON.stringify({ converted: 0 }) };
  }

  let converted = 0;
  let failed = 0;
  const errors = [];

  // FFmpeg is not available in Netlify Functions runtime by default.
  // Check if ffmpeg is available, otherwise log and skip.
  let ffmpegAvailable = false;
  try {
    const { execSync } = require('child_process');
    execSync('ffmpeg -version', { stdio: 'pipe' });
    ffmpegAvailable = true;
  } catch {
    ffmpegAvailable = false;
  }

  if (!ffmpegAvailable) {
    // FFmpeg not available — log warning and keep original files
    console.warn('[convert-video] FFmpeg ikke tilgjengelig i runtime — beholder originalfiler');
    await supabase.from('admin_log').insert({
      action: 'video_conversion_no_ffmpeg',
      order_id,
      note: `FFmpeg ikke tilgjengelig. ${toConvert.length} filer beholdt i originalformat. Vurder å bruke en ekstern konverteringstjeneste.`
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ converted: 0, skipped: toConvert.length, reason: 'ffmpeg_unavailable' })
    };
  }

  const { execFile } = require('child_process');
  const { promisify } = require('util');
  const execFileAsync = promisify(execFile);
  const fs = require('fs');
  const os = require('os');
  const path = require('path');

  for (const file of toConvert) {
    const tmpDir = os.tmpdir();
    const inputPath = path.join(tmpDir, `input-${file.id}-${file.file_name}`);
    const outputName = file.file_name.replace(/\.[^.]+$/, '.mp4');
    const outputPath = path.join(tmpDir, `output-${file.id}-${outputName}`);

    try {
      // Download from Supabase Storage
      const { data: blob, error: dlErr } = await supabase.storage
        .from('tidskapsell-uploads')
        .download(file.file_path);

      if (dlErr) throw new Error(`Download feilet: ${dlErr.message}`);

      const buffer = Buffer.from(await blob.arrayBuffer());
      fs.writeFileSync(inputPath, buffer);

      // Convert to MP4/H.264
      await execFileAsync('ffmpeg', [
        '-i', inputPath,
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-y',
        outputPath
      ], { timeout: 600000 }); // 10 min timeout per file

      // Upload converted file
      const convertedBuffer = fs.readFileSync(outputPath);
      const newPath = file.file_path.replace(/\.[^.]+$/, '.mp4');

      const { error: upErr } = await supabase.storage
        .from('tidskapsell-uploads')
        .upload(newPath, convertedBuffer, {
          contentType: 'video/mp4',
          upsert: true
        });

      if (upErr) throw new Error(`Upload feilet: ${upErr.message}`);

      // Delete original if path changed
      if (newPath !== file.file_path) {
        await supabase.storage
          .from('tidskapsell-uploads')
          .remove([file.file_path]);
      }

      // Update database record
      await supabase
        .from('tidskapsell_files')
        .update({
          file_path: newPath,
          file_name: outputName,
          file_size: convertedBuffer.length,
          mime_type: 'video/mp4'
        })
        .eq('id', file.id);

      converted++;
      console.log(`[convert-video] ✓ Konvertert ${file.file_name} → ${outputName}`);

    } catch (err) {
      failed++;
      errors.push({ file: file.file_name, error: err.message });
      console.error(`[convert-video] ✗ Feil ved konvertering av ${file.file_name}:`, err.message);

      await supabase.from('admin_log').insert({
        action: 'video_conversion_file_failed',
        order_id,
        note: `Konvertering feilet for ${file.file_name}: ${err.message}. Originalfil beholdt.`
      });
    } finally {
      // Cleanup temp files
      try { fs.unlinkSync(inputPath); } catch {}
      try { fs.unlinkSync(outputPath); } catch {}
    }
  }

  await supabase.from('admin_log').insert({
    action: 'video_conversion_completed',
    order_id,
    note: `Konvertering fullført: ${converted} konvertert, ${failed} feilet av ${toConvert.length} filer`
  });

  console.log(`[convert-video] Ferdig: ${converted} konvertert, ${failed} feilet`);

  return {
    statusCode: 200,
    body: JSON.stringify({ converted, failed, errors })
  };
};
