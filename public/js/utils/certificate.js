/* ── High-Resolution Canvas Certificate Generator ─────────── */
const CertificateGenerator = (() => {
  function generate(canvas, { studentName, quizTitle, score, date, certificateId }) {
    const ctx = canvas.getContext('2d');
    const width = 1200;
    const height = 800;

    canvas.width = width;
    canvas.height = height;

    // Background Gradient Parchment
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle Grid Pattern / Watermark
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Outer Gold Border
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 8;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Inner Delicate Border
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(44, 44, width - 88, height - 88);

    // Corner Accents
    const corners = [[50, 50], [width - 50, 50], [50, height - 50], [width - 50, height - 50]];
    corners.forEach(([cx, cy]) => {
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Badge Logo / Icon at top
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.arc(width / 2, 120, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Q', width / 2, 120);

    // Header Title
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 18px sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('QUIZMASTER ACADEMY', width / 2, 185);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 44px Georgia, serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('Certificate of Achievement', width / 2, 245);

    // Subtitle
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 18px Georgia, serif';
    ctx.fillText('This is officially presented to', width / 2, 295);

    // Student Name
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 46px sans-serif';
    ctx.fillText(studentName || 'Student', width / 2, 365);

    // Underline beneath student name
    const textWidth = ctx.measureText(studentName || 'Student').width;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - textWidth / 2 - 20, 385);
    ctx.lineTo(width / 2 + textWidth / 2 + 20, 385);
    ctx.stroke();

    // Achievement Description
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '19px sans-serif';
    ctx.fillText(`for successfully completing and mastering the examination`, width / 2, 435);

    // Quiz Title
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 28px Georgia, serif';
    ctx.fillText(quizTitle || 'Comprehensive Assessment', width / 2, 480);

    // Score Pill
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.beginPath();
    ctx.roundRect(width / 2 - 120, 520, 240, 48, 24);
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`Final Score: ${score}%`, width / 2, 550);

    // Bottom Details Row (Date, Verification Stamp, Signature)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Date: ${date || new Date().toLocaleDateString()}`, 100, 680);
    ctx.fillText(`Certificate ID: ${certificateId || 'QM-CERT-VERIFIED'}`, 100, 705);

    // Seal representation on right
    ctx.save();
    ctx.translate(width - 180, 670);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
    ctx.fill();

    ctx.fillStyle = '#eab308';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OFFICIALLY', 0, -10);
    ctx.fillText('VERIFIED', 0, 5);
    ctx.fillText('★ ★ ★', 0, 20);
    ctx.restore();
  }

  function downloadPNG(canvas, filename = 'Certificate.png') {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return { generate, downloadPNG };
})();
