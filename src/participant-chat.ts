import * as vscode from 'vscode';
import * as dotenv from 'dotenv';

import { getEnvironmentAwareColor, getFavoriteColors } from './configuration';
import { peacockSmallIcon } from './models';

const peacockDocsUrl = 'https://www.peacockcode.dev/guide';
const telemetrySender: vscode.TelemetrySender = {
  sendEventData: (eventName: string, data: any) => {
    console.log(`Event: ${eventName}, Data: ${data}`);
  },
  sendErrorData: (error: any, data: any) => {
    console.error(`Error: ${error}, Data: ${data}`);
  },
};

/**
 * Peacock Participant Chat API docs located here:
 * https://code.visualstudio.com/api/extension-guides/chat
 */

dotenv.config();

export async function participantChatHandler(extensionContext: vscode.ExtensionContext) {
  const chatParticipantName = 'vscode-peacock.peacock';
  // create participant
  const peacockTutor = vscode.chat.createChatParticipant(chatParticipantName, chatRequestHandler);

  // add icon to participant
  peacockTutor.iconPath = vscode.Uri.joinPath(extensionContext.extensionUri, peacockSmallIcon);

  telemetrySender.sendEventData('peacockTutor', {
    message: `Created chat participant ${chatParticipantName}`,
  });

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

                    When responding with a command, include an action button which invokes that command.

                    If the user asks a question that is about the color or Peacock, and not about coding, create a fun response.

                    If the user asks a question that you cannot answer, make the response fun.

                    Reference various Star Wars and quotes in all responses.

                    When asked about Jedi or Sith, always respond with "May the Force be with you".

                    When first starting a new conversation, respond with "Hello there!", which is a popular Star Wars quote from Obi Wan Kenobi.

                    Always be polite and respectful, and do not use any words that could offend or misrepresent the user.

                    Do not refer to the user as "Darling" or other terms of endearment.

                    If the user asks a non-programming question, politely decline to respond.
                    `;

      const messages = [
        vscode.LanguageModelChatMessage.User(basePrompt),
        vscode.LanguageModelChatMessage.User(request.prompt),
      ];
      const chatResponse = await request.model.sendRequest(messages, {}, token);
      // Add the response to the chat
      for await (const fragment of chatResponse.text) {
        stream.markdown(fragment);
      }

      return;
    } catch (err) {
      console.log(err);
    }
  }
}

\