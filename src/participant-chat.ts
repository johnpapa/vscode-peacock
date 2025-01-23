import * as vscode from 'vscode';
import * as dotenv from 'dotenv';
// import * as os from 'os';

import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai'; // add azure stuff here to replace openAI
// import { AzureAISearchVectorStore } from '@langchain/community/vectorstores/azure_aisearch';

import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';

import { Document } from '@langchain/core/documents';
import { getEnvironmentAwareColor, getFavoriteColors } from './configuration';
import fetch from 'node-fetch';
import { peacockSmallIcon } from './models';

// import { VectorStore } from '@langchain/core/vectorstores';

// const LANGUAGE_MODEL_ID = 'copilot-gpt-3.5-turbo'; // Use faster model. Alternative is 'copilot-gpt-4', which is slower but more powerful
const peacockDocsUrl = 'https://www.peacockcode.dev/guide';

/**
 * Peacock Participant Chat API docs located here:
 * https://code.visualstudio.com/api/extension-guides/chat
 */

dotenv.config(); //{ path: os.homedir() + '/.env' });

export async function participantChatHandler(extensionContext: vscode.ExtensionContext) {
  // create participant
  const peacockTutor = vscode.chat.createChatParticipant(
    'vscode-peacock.peacock',
    chatRequestHandler,
  );

  // add icon to participant
  peacockTutor.iconPath = vscode.Uri.joinPath(extensionContext.extensionUri, peacockSmallIcon);

  createTelemetryLogger();

  //   id: string,
  // name: string,
  // userDescription: string,
  // modelDescription: string | undefined,
  // isSlow: boolean | undefined,
  // resolver: ChatVariableResolver,
  // fullName?: string,
  // icon?: ThemeIcon,

  // vscode.chat.registerChatVariableResolver(
  //   'peacock',
  //   'peacock-for-vscode',
  //   'peacock-user',
  //   'peacock-docs-model',
  //   true,
  //   {
  //     resolve: async (name, chatVariableContext /* token */) => {
  //       try {
  //         return await getPeacockDocs(chatVariableContext);
  //       } catch (err: any) {
  //         // show a notification with the error
  //         vscode.window.showErrorMessage(err.message);
  //       }
  //     },
  //   },
  // );

  async function chatRequestHandler(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
  ) {
    try {
      const currentColor = getEnvironmentAwareColor();
      const { values: favoriteColors } = getFavoriteColors();
      const peacockColorList = favoriteColors
        .map(color => `- Name: "${color.name}", Color: ${color.value}`)
        .join('\n ');

      const basePrompt = `
                    Your job is to help users choose the color scheme to use with their code editor. Users generally want fun colors that work well and compliment each other. Users also want to choose different colors and shdes that will help them differentiate the Instances of the code editors, where each editor has a different color. You will pretend to be a high society interior designer who has vast experience in color design.

                    When prompting and responding, use the Peacock emoji.

                    Always answer with the color name and the color HEX code.

                    Always offer to apply the color using the Peacock Code extension for the user.

                    Provide Instructions on how to apply the color.

                    If a user asks about the current color, tell them how to find the current color with Peacock and also tell them the current color Is ${currentColor}

                    For any questions about the docs, please refer the user to the Peacock Code docs at ${peacockDocsUrl}.

                    If the color Is In the Favorites list ${peacockColorList}, suggest that the user apply the color with the command "Peacock: Change Color to Favorite".

                    If the color Is not In the favorites list, suggest that the user apply the color with the command "Peacock: Enter Color".

                    If the users asks about saving the color to their favorites, suggest that the user apply the color with the command "Peacock: Save Color to Favorites".

                    If the user does not specify the name of the color, you can choose any color to respond.

                    If the user asks a question about multiple colors, provide the best answer to help them choose.

                    If the user asks a question that is about the color or Peacock, and not about coding, create a fun response.

                    Always be polite and respectful, and do not use any words that could offend or misrepresent the user.

                    Do not refer to the user as "Darling" or other terms of endearment.

                    If the user asks a non-programming question, politely decline to respond.
                    `;

      const vectorStore = await getPeacockDocsAsVectorStore(basePrompt);
      // const model = new ChatOpenAI(); // q. do I need to pass openai key here?
      const model = new ChatOpenAI({ apiKey: getOpenAIKey() });
      const questionAnsweringPrompt = ChatPromptTemplate.fromMessages([
        ['system', "Answer the user's question using only the sources below:\n\n{context}"],
        ['human', '{input}'],
      ]);
      const messages = [
        // vscode.LanguageModelChatMessage.User(docContext),
        vscode.LanguageModelChatMessage.User(basePrompt),
        vscode.LanguageModelChatMessage.User(request.prompt),
      ];
      const ragChain = await createStuffDocumentsChain({
        llm: model,
        prompt: questionAnsweringPrompt,
      });
      const ragChainStream = await ragChain.stream({
        input: request.prompt,
        context: vectorStore,
      });

      //const chatResponse = await request.model.sendRequest(messages, {}, token);
      // Add the response to the chat
      // for await (const fragment of chatResponse.text) {
      //   stream.markdown(fragment);
      // }
      for await (const fragment of ragChainStream) {
        stream.markdown(fragment);
      }

      return;
    } catch (err) {
      console.log(err);
    }
  }
}

async function getPeacockDocsAsVectorStore(prompt: string) {
  // get the content of the url
  const urlContent = (await downloadWebPage(peacockDocsUrl)) || '';

  // split the text into smaller chunks
  const documents = await splitTextIntoChunks(urlContent);

  // create the vector store
  const vectorStoreRetriever = await createVectorStore(documents);

  // get the relevant parts of the text content based on the users prompt
  // const docs = await vectorStoreRetriever.getRelevantDocuments(context.prompt); // getRelevantDocuments Is deprecated, use Invoke Instead
  const docs = await vectorStoreRetriever.invoke(prompt);

  return docs;

  // // assemble the relevant parts of the text content into a single string
  // let pageContent = '';
  // docs.forEach(doc => {
  //   pageContent += doc.pageContent;
  // });

  // return [
  //   {
  //     level: vscode.ChatVariableLevel.Full,
  //     value: pageContent,
  //   },
  // ];
}

async function downloadWebPage(url: string) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const doc = new JSDOM(html, { url });
    const reader = new Readability(doc.window.document);
    const article = reader.parse() || '';

    let content = article ? article.content : '';

    // remove all images
    content = content.replace(/<img[^>]*>/g, '');

    // strip all html chars out of the content
    content = content.replace(/<[^>]*>?/gm, '');

    // remove all line breaks
    content = content.replace(/\r?\n|\r/g, '');

    return content;
  } catch (err: any) {
    // show a notification with the error
    vscode.window.showErrorMessage(err.message);
  }
}

async function splitTextIntoChunks(text: string) {
  // use text splitting to create a vector store from the content
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 100,
  });

  const documents = await splitter.createDocuments([text]);

  return documents;
}

async function createVectorStore(documents: Document<Record<string, any>>[]) {
  const openAIApiKey = getOpenAIKey();
  if (!openAIApiKey) {
    throw new Error('OpenAI API key is not set. Please set it using setOpenAIKey function.');
  }

  const embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-large',
    apiKey: openAIApiKey,
  });
  const vectorStore = new MemoryVectorStore(embeddings);
  vectorStore.addDocuments(documents);

  // const vectorStore = await HNSWLib.fromDocuments(
  //   documents,
  //   new OpenAIEmbeddings({ apiKey: openAIApiKey }),
  // );
  // Initialize a retriever wrapper around the vector store
  const vectorStoreRetriever = vectorStore.asRetriever();

  return vectorStoreRetriever;
}

function setOpenAIKey(apiKey: string) {
  process.env.OPENAI_API_KEY = apiKey;
  //dotenv.config({ path: os.homedir() + '/.env' });
}

function getOpenAIKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}

function createTelemetryLogger() {
  // TODO: create a telemetry logger
  //const sender: vscode.TelemetrySender = {...};
  // // GOOD - uses the logger
  // logger.logUsage('myEvent', { myData: 'myValue' });
  // // BAD - uses the sender directly: no data cleansing, ignores user settings, no echoing to the telemetry output channel etc
  // sender.logEvent('myEvent', { myData: 'myValue' });
  // const logger = vscode.env.createTelemetryLogger(sender);
  // peacockTutor.onDidReceiveFeedback((feedback: vscode.ChatResultFeedback) => {
  //   // Log chat result feedback to be able to compute the success metric of the participant
  //   logger.logUsage('chatResultFeedback', {
  //     kind: feedback.kind,
  //   });
  // });
}
