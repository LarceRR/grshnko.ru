export interface PeerId {
    channelId: string;
    className: string;
  }
  
  export interface FileReference {
    type: string;
    data: number[];
  }
  
  export interface PhotoSize {
    type: string;
    w?: number;
    h?: number;
    size?: number;
    bytes?: FileReference;
    sizes?: number[];
    className: string;
  }
  
  export interface Photo {
    flags: number;
    hasStickers: boolean;
    id: string;
    accessHash: string;
    fileReference: FileReference;
    date: number;
    sizes: PhotoSize[];
    videoSizes: null;
    dcId: number;
    className: string;
  }
  
  export interface MessageMediaPhoto {
    flags: number;
    spoiler: boolean;
    photo: Photo;
    ttlSeconds: null;
    className: string;
  }
  
  export interface MessageEntity {
    offset: number;
    length: number;
    className: string;
  }
  
  export interface ReactionEmoji {
    emoticon: string;
    className: string;
  }
  
  export interface ReactionCount {
    flags: number;
    chosenOrder: number;
    reaction: ReactionEmoji;
    count: number;
    className: string;
  }
  
  export interface MessageReactions {
    flags: number;
    min: boolean;
    canSeeList: boolean;
    reactionsAsTags: boolean;
    results: ReactionCount[];
    recentReactions: null;
    topReactors: null;
    className: string;
  }
  
  export interface Message {
    flags: number;
    out: boolean;
    mentioned: boolean;
    mediaUnread: boolean;
    silent: boolean;
    post: boolean;
    fromScheduled: boolean;
    legacy: boolean;
    editHide: boolean;
    pinned: boolean;
    noforwards: boolean;
    invertMedia: boolean;
    flags2: number;
    offline: boolean;
    videoProcessingPending: boolean;
    id: number;
    fromId: null;
    fromBoostsApplied: null;
    peerId: PeerId;
    savedPeerId: null;
    fwdFrom: null;
    viaBotId: null;
    viaBusinessBotId: null;
    replyTo: null;
    date: number;
    message: string;
    media: MessageMediaPhoto;
    replyMarkup: null;
    entities: MessageEntity[];
    views: number;
    forwards: number;
    replies: null;
    editDate: number | null;
    postAuthor: null;
    groupedId: null;
    reactions: MessageReactions | null;
    restrictionReason: null;
    ttlPeriod: null;
    quickReplyShortcutId: null;
    effect: null;
    factcheck: null;
    reportDeliveryUntilDate: null;
    className: string;
  }
  
  export interface MessageActionChannelCreate {
    title: string;
    className: string;
  }
  
  export interface MessageService {
    flags: number;
    out: boolean;
    mentioned: boolean;
    mediaUnread: boolean;
    reactionsArePossible: boolean;
    silent: boolean;
    post: boolean;
    legacy: boolean;
    id: number;
    fromId: null;
    peerId: PeerId;
    replyTo: null;
    date: number;
    action: MessageActionChannelCreate;
    reactions: null;
    ttlPeriod: null;
    className: string;
  }
  
  export interface Messages {
    messages: Array<Message | MessageService>;
  }