import { PDFDocument } from 'pdf-lib';

// DOM元素
const pdf1Input = document.getElementById('pdf1');
const pdf2Input = document.getElementById('pdf2');
const scaleInput = document.getElementById('scale');
const mergeBtn = document.getElementById('mergeBtn');
const statusDiv = document.getElementById('status');
const downloadDiv = document.getElementById('download');

// 存储上传的文件
let headerPdfBytes = null;
let targetPdfBytes = null;

// 文件上传处理
pdf1Input.addEventListener('change', handlePdf1Upload);
pdf2Input.addEventListener('change', handlePdf2Upload);
mergeBtn.addEventListener('click', mergePdfs);

async function handlePdf1Upload(event) {
    const file = event.target.files[0];
    if (file) {
        headerPdfBytes = await file.arrayBuffer();
        showStatus('Header PDF loaded', 'success');
        checkReadyToMerge();
    }
}

async function handlePdf2Upload(event) {
    const file = event.target.files[0];
    if (file) {
        targetPdfBytes = await file.arrayBuffer();
        showStatus('Target PDF loaded', 'success');
        checkReadyToMerge();
    }
}

function checkReadyToMerge() {
    mergeBtn.disabled = !(headerPdfBytes && targetPdfBytes);
}

function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
}

// 核心合并逻辑
async function mergePdfs() {
    try {
        showStatus('Processing PDFs...', 'info');
        
        // 加载PDFs
        const headerPdf = await PDFDocument.load(headerPdfBytes);
        const targetPdf = await PDFDocument.load(targetPdfBytes);
        
        // 获取缩放因子
        const scaleFactor = parseFloat(scaleInput.value);
        
        // 嵌入header PDF的第一页到target PDF
        const [headerPage] = await targetPdf.embedPdf(headerPdf, [0]);
        
        // 获取target PDF的第一页
        const firstPage = targetPdf.getPages()[0];
        
        // 在左上角绘制header页面（缩放后）
        firstPage.drawPage(headerPage, {
            x: 0,
            y: firstPage.getHeight() - headerPage.height * scaleFactor,
            width: headerPage.width * scaleFactor,
            height: headerPage.height * scaleFactor,
        });
        
        // 保存结果
        const pdfBytes = await targetPdf.save();
        
        // 创建下载链接
        createDownloadLink(pdfBytes);
        
        showStatus('PDF merged successfully!', 'success');
        
    } catch (error) {
        console.error('Error merging PDFs:', error);
        showStatus('Error: ' + error.message, 'error');
    }
}

function createDownloadLink(pdfBytes) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    downloadDiv.innerHTML = `
        <a href="${url}" download="merged.pdf" style="
            display: inline-block;
            padding: 10px 20px;
            background: #28a745;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 10px;
        ">Download Merged PDF</a>
    `;
}