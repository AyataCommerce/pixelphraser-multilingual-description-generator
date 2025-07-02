export interface MessageData {
    id: string;
    notificationType: string;
    type: string;
    resource?: { id: string };
}