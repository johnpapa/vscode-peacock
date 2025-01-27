import * as vscode from 'vscode';
import * as dotenv from 'dotenv';

import { getEnvironmentAwareColor, getFavoriteColors } from './configuration';
import { Commands, peacockSmallIcon } from './models';

const peacockDocsUrl = 'https://www.peacockcode.dev/guide';

const logger = vscode.env.createTelemetryLogger({
  sendEventData(eventName, data) {
    // Capture event telemetry
    console.log(`Event: ${eventName}, Data: ${JSON.stringify(data)}`);
  },
  sendErrorData(error, data) {
    // Capture error telemetry
    console.error(`Error: ${error}, Data: ${JSON.stringify(data)}`);
  },
});

/**
 * Peacock Participant Chat API docs located here:
 * https://code.visualstudio.com/api/extension-guides/chat
 */

dotenv.config();

export async function participantChatHandler(extensionContext: vscode.ExtensionContext) {
  const chatParticipantName = 'vscode-peacock.peacock';
  const peacockChatParticipant = vscode.chat.createChatParticipant(
    chatParticipantName,
    chatRequestHandler,
  );

  // add icon to participant
  peacockChatParticipant.iconPath = vscode.Uri.joinPath(
    extensionContext.extensionUri,
    peacockSmallIcon,
  );

  logger.logUsage('peacockChatParticipant', {
    message: `Created chat participant ${chatParticipantName}`,
  });

  extensionContext.subscriptions.push(
    peacockChatParticipant.onDidReceiveFeedback((feedback: vscode.ChatResultFeedback) => {
      // Log chat result feedback to compute the success metric of the participant
      // unhelpful / totalRequests is a good success metric
      logger.logUsage('chatResultFeedback', {
        kind: feedback.kind,
      });
    }),
  );

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
                    Your job is to help users choose the color scheme to use with their code editor. Users want fun colors that compliment each other to help them differentiate the instances of complement the VS Code editors, where each editor has a different color.

                    Always answer with the color name and the color HEX code.

                    Always offer to apply the color using the Peacock Code extension for the user.

                    Provide instructions and show a button in the chat to apply the color.

                    If a user asks about the current color, tell them how to find the current color with Peacock and also tell them the current color is ${currentColor}.

                    When the user needs more Information, include a link to the Peacock Code docs at ${peacockDocsUrl} at the end of the response.

                    If the color is in the Favorites list ${peacockColorList}, suggest that the user apply the color with the command "Peacock: Change Color to Favorite".

                    If the color is not in the favorites list, suggest that the user apply the color with the command "Peacock: Enter Color".

                    If the users asks about saving the color to their favorites, suggest that the user apply the color with the command "Peacock: Save Color to Favorites".

                    If the user does not specify the name of the color, you can choose any color to respond.

                    If the user asks a question about multiple colors, provide the best answer to help them choose.

                    When responding with a command, include an action button which invokes that command.

                    If the user asks a question that you cannot answer, make the response fun In the context of Star Wars.

                    Reference various Star Wars movies, Star Wars Rebels animated series, Star Wars The Bad Batch aniamted series, and Star Wars the Clone Wars animated series in all responses, using quotes and character references.

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
      let rawResponse = '';
      // Add the response to the chat
      for await (const fragment of chatResponse.text) {
        stream.markdown(fragment);
        rawResponse += fragment;
      }

      // const fullCommandCodeStart = rawResponse.indexOf('(command:peacock.');
      // const commandCodeEnd = rawResponse.substring(fullCommandCodeStart).indexOf(')');
      // const commandCodeStart = fullCommandCodeStart + `(command:`.length;
      // const buttonStart = rawResponse.substring(0, fullCommandCodeStart - 1).indexOf('[');
      // const buttonEnd = rawResponse.indexOf(')', buttonStart) + 1;
      // let color = '';
      // let commandType: Commands;
      // let commandExists = false;
      // if (fullCommandCodeStart > -1) {
      //   // check If rawResponse contains any of a set of strings In an array
      //   const checkStrings = [Commands.enterColor, Commands.changeColorToFavorite];
      //   const containsString = checkStrings.some(str =>
      //     rawResponse.toLowerCase().includes(str.toLowerCase()),
      //   );

      //   if (containsString) {
      //     commandExists = true;
      //     commandType = Commands.enterColor;
      //     const fullCommand = decodeURI(
      //       rawResponse.substring(fullCommandCodeStart + 1, fullCommandCodeStart + commandCodeEnd),
      //     );
      //     const colorPosition = rawResponse.indexOf('#') + 1;
      //     color = rawResponse.substring(colorPosition, colorPosition + 6);
      //   }
      // }

      //   const buttonText = rawResponse.substring(buttonStart + 1, fullCommandCodeStart - 1);
      //   let command = rawResponse.substring(
      //     commandCodeStart,
      //     fullCommandCodeStart + commandCodeEnd,
      //   );
      //   let args = [];
      //   const commandArgsStart = command.indexOf('?');
      //   if (commandArgsStart > -1) {
      //     let arg = command.substring(commandArgsStart + 1);
      //     arg = decodeURI(decodeURI(arg));
      //     args.push(arg);
      //     command = command.substring(0, commandArgsStart);
      //   }
      // if (commandExists && commandType! === Commands.enterColor) {
      //   const title = `Change Color to ${color}`;
      //   const button = {
      //     title,
      //     command: Commands.enterColor,
      //     tooltip: title,
      //     arguments: [color],
      //   };
      //   console.log(button);
      //   stream.button(button);
      // }
      logger.logUsage('peacockChatParticipant Response', {
        prompt: request.prompt,
        response: rawResponse,
      });

      return;
    } catch (err) {
      console.log(err);
    }
  }
}
