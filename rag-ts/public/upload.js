const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileMeta = document.getElementById('fileMeta');
const uploadBtn = document.getElementById('uploadBtn');
const result = document.getElementById('result');
const loading = document.getElementById('loading');

let selectedFile = null;

uploadArea.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    handleFile(e.target.files[0]);
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

function handleFile(file) {
    if (!file) return;
    
    if (!file.name.endsWith('.txt')) {
        showResult('仅支持 .txt 文件', 'error');
        return;
    }
    
    selectedFile = file;
    fileName.textContent = `文件名：${file.name}`;
    const sizeKB = (file.size / 1024).toFixed(2);
    fileMeta.textContent = `格式：${file.type || 'text/plain'} | 大小：${sizeKB} KB`;
    
    fileInfo.classList.remove('hidden');
    result.classList.add('hidden');
}

uploadBtn.addEventListener('click', async () => {
    if (!selectedFile) return;
    
    loading.classList.remove('hidden');
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
        const response = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showResult(data.message, 'success');
        } else {
            showResult('上传失败', 'error');
        }
    } catch (error) {
        showResult('上传失败：' + error.message, 'error');
    } finally {
        loading.classList.add('hidden');
    }
});

function showResult(message, type) {
    result.textContent = message;
    result.className = `result ${type}`;
    result.classList.remove('hidden');
}
