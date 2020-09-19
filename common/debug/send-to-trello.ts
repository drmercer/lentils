import { error2Markdown } from "./error";
import { diagnosticMarkdown } from "./diagnostics";

export interface TrelloNewCardProps {
  name: string;
  sourceHost?: string;
  description?: string;
  attachmentUrl?: string;
  boardId?: string;
  listId?: string;
}

export function getTrelloAddCardLink(
  props: TrelloNewCardProps,
): string {
  // See https://trello.com/add-card for the snippet I reverse-engineered this from.
  return 'https://trello.com/add-card' +
    '?source=' + encodeURIComponent(props.sourceHost || 'danmercer.net') +
    '&mode=popup' +
    (props.attachmentUrl ? '&url=' + encodeURIComponent(props.attachmentUrl) : '') +
    (props.name ? '&name=' + encodeURIComponent(props.name) : '') +
    (props.description ? '&desc=' + encodeURIComponent(props.description.trim()) : '') +
    (props.boardId ? '&idBoard=' + encodeURIComponent(props.boardId) : '') +
    (props.listId ? '&idList=' + encodeURIComponent(props.listId) : '');
}

export function getTrelloErrorReportLink(error: Error, boardId?: string) {
  return getTrelloAddCardLink({
    name: "Error report: " + error.message,
    description: error2Markdown(error) + '\n\n' + diagnosticMarkdown(),
    boardId,
  });
}
