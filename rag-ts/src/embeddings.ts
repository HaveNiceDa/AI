import { Embeddings, type EmbeddingsParams } from "@langchain/core/embeddings";

export class DashScopeEmbeddings extends Embeddings {
  private apiKey: string;
  private model: string;

  constructor(
    fields: { apiKey?: string; model?: string } & EmbeddingsParams = {},
  ) {
    super(fields);
    this.apiKey = fields.apiKey || process.env.DASHSCOPE_API_KEY || "";
    this.model = fields.model || "text-embedding-v4";
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((text) => this.embedQuery(text)));
  }

  async embedQuery(text: string): Promise<number[]> {
    const response = await fetch(
      "https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          input: {
            texts: [text],
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`DashScope API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    return data.output.embeddings[0].embedding;
  }
}
