// public/js/main.js
document.getElementById('generateBtn').addEventListener('click', async () => {
  const name = document.getElementById('name').value.trim();
  const contactType = document.getElementById('contactType').value;
  const contactValue = document.getElementById('contactValue').value.trim();
  const teacher = document.getElementById('teacher').value.trim();

  if (!name || !contactValue || !teacher) {
    alert('请完整填写信息');
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');

  function drawBase(qrCanvas) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#333';
    ctx.font = '20px Arial';
    ctx.fillText('学生自助返校系统', 20, 40);
    ctx.font = '18px Arial';
    ctx.fillText('姓名：' + name, 20, 90);
    ctx.fillText('联系方式类型：' + contactType, 20, 130);
    ctx.fillText('联系方式：' + contactValue, 20, 170);
    ctx.fillText('小学班主任：' + teacher, 20, 210);
    if (qrCanvas) ctx.drawImage(qrCanvas, 420, 80);
  }

  // 先画占位二维码
  const qrTempCanvas = document.createElement('canvas');
  QRCode.toCanvas(qrTempCanvas, '生成中', { width:160 }, function (error) {
    if (error) console.error(error);
    drawBase(qrTempCanvas);
    const container = document.getElementById('cardCanvasContainer');
    container.innerHTML = '';
    container.appendChild(canvas);
    document.getElementById('resultCard').style.display = 'block';
  });

  // 上传临时图片以获取 id
  const dataURL = canvas.toDataURL('image/png');
  const resp = await fetch('/api/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name, contact_type: contactType, contact_value: contactValue, teacher, imageData: dataURL
    })
  });
  const result = await resp.json();
  if (!result.success) {
    alert('保存失败');
    return;
  }
  const id = result.id;
  const qrCanvas = document.createElement('canvas');
  const qrText = location.origin + '/card/' + id;
  QRCode.toCanvas(qrCanvas, qrText, { width:160 }, function (error) {
    if (error) console.error(error);
    drawBase(qrCanvas);
    const container = document.getElementById('cardCanvasContainer');
    container.innerHTML = '';
    container.appendChild(canvas);

    const finalDataURL = canvas.toDataURL('image/png');
    // 可选：覆盖上传最终图片（不影响首次生成）
    fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, contact_type: contactType, contact_value: contactValue, teacher, imageData: finalDataURL
      })
    }).catch(()=>{});

    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.onclick = () => {
      const a = document.createElement('a');
      a.href = finalDataURL;
      a.download = `card_${name}_${id}.png`;
      a.click();
    };

    document.getElementById('statusMsg').textContent = '生成成功，二维码已嵌入卡片，扫码可查看信息';
  });
});
