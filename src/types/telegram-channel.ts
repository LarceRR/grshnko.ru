export interface StrippedThumb {
  type?: string;
  data?: number[];
}

export interface Photo {
  flags?: number;
  hasVideo?: boolean;
  photoId?: string;
  strippedThumb?: StrippedThumb;
  dcId?: number;
  className?: string;
}

export interface AdminRights {
  flags?: number;
  changeInfo?: boolean;
  postMessages?: boolean;
  editMessages?: boolean;
  deleteMessages?: boolean;
  banUsers?: boolean;
  inviteUsers?: boolean;
  pinMessages?: boolean;
  addAdmins?: boolean;
  anonymous?: boolean;
  manageCall?: boolean;
  other?: boolean;
  manageTopics?: boolean;
  postStories?: boolean;
  editStories?: boolean;
  deleteStories?: boolean;
  className?: string;
}

export interface Entity {
  flags?: number;
  creator?: boolean;
  left?: boolean;
  broadcast?: boolean;
  verified?: boolean;
  megagroup?: boolean;
  restricted?: boolean;
  signatures?: boolean;
  min?: boolean;
  scam?: boolean;
  hasLink?: boolean;
  hasGeo?: boolean;
  slowmodeEnabled?: boolean;
  callActive?: boolean;
  callNotEmpty?: boolean;
  fake?: boolean;
  gigagroup?: boolean;
  noforwards?: boolean;
  joinToSend?: boolean;
  joinRequest?: boolean;
  forum?: boolean;
  flags2?: number;
  storiesHidden?: boolean;
  storiesHiddenMin?: boolean;
  storiesUnavailable?: boolean;
  signatureProfiles?: boolean;
  id?: string;
  accessHash?: string;
  title?: string;
  username?: string;
  photo?: Photo;
  date?: number;
  restrictionReason?: string | null;
  adminRights?: AdminRights | null;
  bannedRights?: unknown | null;
  defaultBannedRights?: unknown | null;
  participantsCount?: number;
  usernames?: string[] | null;
  storiesMaxId?: string | null;
  color?: string | null;
  profileColor?: string | null;
  emojiStatus?: string | null;
  level?: number | null;
  subscriptionUntilDate?: number | null;
  botVerificationIcon?: string | null;
  className?: string;
}

export interface TelegramChannel {
  id: string;
  offsetPeerId?: number;
  offsetMsgId?: number
  title?: string;
  entity?: Entity;
  username?: string;
  avatar?: string;
  isChannel?: boolean;
  isPinned?: boolean;
}

export const defaultChannel: TelegramChannel = {
    "id": "-1002915407636",
    "offsetPeerId": 2915407636,
    "title": "Счастливый садовод",
    "entity": {
        "flags": 155745,
        "creator": true,
        "left": false,
        "broadcast": true,
        "verified": false,
        "megagroup": false,
        "restricted": false,
        "signatures": false,
        "min": false,
        "scam": false,
        "hasLink": false,
        "hasGeo": false,
        "slowmodeEnabled": false,
        "callActive": false,
        "callNotEmpty": false,
        "fake": false,
        "gigagroup": false,
        "noforwards": false,
        "joinToSend": false,
        "joinRequest": false,
        "forum": false,
        "flags2": 8,
        "storiesHidden": false,
        "storiesHiddenMin": false,
        "storiesUnavailable": true,
        "signatureProfiles": false,
        "id": "2915407636",
        "accessHash": "-3070472540765301356",
        "title": "Счастливый садовод",
        "username": "dacha_easy",
        "photo": {
            "flags": 2,
            "hasVideo": false,
            "photoId": "5294274141760910368",
            "strippedThumb": {
                "type": "Buffer",
                "data": [
                    1,
                    8,
                    8,
                    144,
                    188,
                    254,
                    96,
                    28,
                    249,
                    155,
                    186,
                    119,
                    162,
                    138,
                    43,
                    56,
                    220,
                    132,
                    174,
                    127
                ]
            },
            "dcId": 2,
            "className": "ChatPhoto"
        },
        "date": 1756302385,
        "restrictionReason": null,
        "adminRights": {
            "flags": 129727,
            "changeInfo": true,
            "postMessages": true,
            "editMessages": true,
            "deleteMessages": true,
            "banUsers": true,
            "inviteUsers": true,
            "pinMessages": true,
            "addAdmins": true,
            "anonymous": false,
            "manageCall": true,
            "other": true,
            "manageTopics": true,
            "postStories": true,
            "editStories": true,
            "deleteStories": true,
            "className": "ChatAdminRights"
        },
        "bannedRights": null,
        "defaultBannedRights": null,
        "participantsCount": 1,
        "usernames": null,
        "storiesMaxId": null,
        "color": null,
        "profileColor": null,
        "emojiStatus": null,
        "level": null,
        "subscriptionUntilDate": null,
        "botVerificationIcon": null,
        "className": "Channel"
    },
    "username": "dacha_easy",
    "avatar": "data:image/jpeg;base64,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",
    "isChannel": true
}