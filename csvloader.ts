import { CSVLoader } from '@langchain/community/document_loaders/fs/csv';

// 创建CSVLoader实例
// 注意：不同版本的CSVLoader API可能有所不同，这里使用较新版本的API
const loader = new CSVLoader(
  './data/stu.csv',  // 第一个参数直接是文件路径
  {
    // columnKeys 不在 CSVLoaderOptions 类型中，已移除
    separator: ',',  // 指定分隔符
  }
);

// 批量加载 .load() -> [Document, Document, ...]
async function loadBatch() {
  const documents = await loader.load();
  for (const document of documents) {
    console.log(typeof document, document);
  }
}

// 执行批量加载
loadBatch();