import type { BaseEmbeddings } from '@cherrystudio/embedjs-interfaces'
import { OllamaEmbeddings } from '@cherrystudio/embedjs-ollama'
import { OpenAiEmbeddings } from '@cherrystudio/embedjs-openai'
import type { ApiClient } from '@types'
import { net } from 'electron'

import { VoyageEmbeddings } from './VoyageEmbeddings'

export default class EmbeddingsFactory {
  static create({ embedApiClient, dimensions }: { embedApiClient: ApiClient; dimensions?: number }): BaseEmbeddings {
    const batchSize = 10
    const { model, provider, apiKey, baseURL } = embedApiClient
    if (provider === 'voyageai') {
      return new VoyageEmbeddings({
        modelName: model,
        apiKey,
        outputDimension: dimensions,
        batchSize: 8
      })
    }
    if (provider === 'ollama') {
      return new OllamaEmbeddings({
        model: model,
        baseUrl: baseURL.replace(/\/api$/, ''),
        requestOptions: {
          // @ts-ignore expected
          'encoding-format': 'float'
        }
      })
    }
    // NOTE: Azure OpenAI 也走 OpenAIEmbeddings, baseURL是https://xxxx.openai.azure.com/openai/v1
    return new OpenAiEmbeddings({
      model,
      apiKey,
      dimensions,
      batchSize,
      // Use 'float' encoding format for broader compatibility with OpenAI-compatible providers
      // (e.g., SiliconFlow, etc.) that may not support 'base64' encoding format.
      // @ts-ignore - encodingFormat is a valid OpenAIEmbeddingsParams field but the wrapper type doesn't expose it
      encodingFormat: 'float',
      configuration: { baseURL, fetch: net.fetch as typeof fetch }
    })
  }
}
