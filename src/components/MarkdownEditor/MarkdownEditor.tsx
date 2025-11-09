import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import "./MarkdownEditor.scss";
import Toolbar from "./Toolbar/Toolbar";
import EditorTextarea from "./EditorTextarea/EditorTextarea";
import Hashtags from "./Hashtags/Hashtags";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useHistory } from "./hooks/useHistory";
import { useFormatting } from "./hooks/useFormatting";
import { MarkdownEditorProps, Entity } from "./types";
import { formatTextToHTML } from "./utils/formatting";
import { Modal, Input, Button } from "antd";
import { API_URL } from "../../config";
import { TelegramChannel } from "../../types/telegram-channel";
import { useAppSelector } from "../../store/hooks";
import LoaderSpinner from "../LoadingBanner/LoaderSpinner/LoaderSpinner";
export type { Entity, MarkdownEditorProps };

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  onEntitiesChange,
  videoSourceUrl,
  channelUrl,
  aiResponse,
  isAiGenerating = false,
}) => {
  const [internalText, setInternalText] = useState("");
  const [entities, setEntities] = useState<Entity[]>([]);
  const [forceUpdate, setForceUpdate] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const [isAuthorModalOpen, setAuthorModalOpen] = useState(false);
  const [authorLinkText, setAuthorLinkText] = useState("(Автор)");
  const [isChannelModalOpen, setChannelModalOpen] = useState(false);
  const [selectedChannelForLink, setSelectedChannelForLink] =
    useState<TelegramChannel | null>(null);

  // Если передан aiResponse, он имеет приоритет над value
  // Иначе используем value или internalText
  const text =
    aiResponse !== undefined
      ? aiResponse
      : value !== undefined
        ? value
        : internalText;

  const activeChannel = useAppSelector(
    (state) => state.selectedChannel.channel
  );

  const {
    history,
    historyIndex,
    pushHistory,
    undo: undoHistory,
    redo: redoHistory,
    clearHistory,
  } = useHistory();

  const handleEntitiesChange = useCallback(
    (newEntities: Entity[]) => {
      setEntities(newEntities);
      onEntitiesChange?.(newEntities);
    },
    [onEntitiesChange]
  );

  const handleTextChange = useCallback(
    (newText: string) => {
      if (value === undefined) {
        setInternalText(newText);
      }
      onChange?.(newText);
    },
    [onChange, value]
  );

  const {
    activeFormats,
    applyFormatting,
    clearFormatting,
    updateActiveFormats,
  } = useFormatting({
    text,
    entities,
    editorRef,
    onChange: handleTextChange,
    onEntitiesChange: handleEntitiesChange,
    onHistoryPush: pushHistory,
  });

  const undo = () => {
    const prevState = undoHistory();
    if (prevState) {
      setInternalText(prevState.text);
      setEntities(prevState.entities);
      handleTextChange(prevState.text);
      handleEntitiesChange(prevState.entities);
      // Принудительно обновляем HTML через forceUpdate
      setForceUpdate((prev) => !prev);
    }
  };

  const redo = () => {
    const nextState = redoHistory();
    if (nextState) {
      setInternalText(nextState.text);
      setEntities(nextState.entities);
      handleTextChange(nextState.text);
      handleEntitiesChange(nextState.entities);
      // Принудительно обновляем HTML через forceUpdate
      setForceUpdate((prev) => !prev);
    }
  };

  const setCursorToOffset = useCallback((targetOffset: number) => {
    if (!editorRef.current) return;

    try {
      const selection = window.getSelection();
      if (!selection) return;

      const walker = document.createTreeWalker(
        editorRef.current,
        NodeFilter.SHOW_TEXT,
        null
      );

      let currentOffset = 0;
      let node: Node | null;
      let targetNode: Text | null = null;
      let offsetInNode = 0;

      while ((node = walker.nextNode())) {
        const textNode = node as Text;
        const nodeLength = textNode.textContent?.length || 0;

        if (currentOffset + nodeLength >= targetOffset) {
          targetNode = textNode;
          offsetInNode = targetOffset - currentOffset;
          break;
        }

        currentOffset += nodeLength;
      }

      if (!targetNode) {
        const fallbackNode = editorRef.current.lastChild;
        if (!fallbackNode || fallbackNode.nodeType !== Node.TEXT_NODE) {
          return;
        }
        targetNode = fallbackNode as Text;
        offsetInNode = targetNode.textContent?.length || 0;
      }

      const range = document.createRange();
      const finalOffset = Math.min(
        offsetInNode,
        targetNode.textContent?.length || 0
      );
      range.setStart(targetNode, finalOffset);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } catch (e) {
      // игнорируем ошибки позиционирования курсора
    }
  }, []);

  const insertLinkLine = useCallback(
    (displayText: string, url: string) => {
      if (!editorRef.current || !url) return;

      const currentText = editorRef.current.innerText || "";
      const needsNewline =
        currentText.length > 0 && !currentText.endsWith("\n");
      const insertionText = `${needsNewline ? "\n" : ""}${displayText}`;
      const newText = currentText + insertionText;
      const linkOffset = currentText.length + (needsNewline ? 1 : 0);

      const newEntity: Entity = {
        type: "text_url",
        offset: linkOffset,
        length: displayText.length,
        url,
      };

      const updatedEntities = [...entities, newEntity];

      handleTextChange(newText);
      handleEntitiesChange(updatedEntities);

      const newHTML = formatTextToHTML(newText, updatedEntities);
      editorRef.current.innerHTML = newHTML;
      setForceUpdate((prev) => !prev);

      pushHistory(newText, updatedEntities);

      setTimeout(() => {
        setCursorToOffset(newText.length);
      }, 0);
    },
    [
      entities,
      handleEntitiesChange,
      handleTextChange,
      pushHistory,
      setCursorToOffset,
    ]
  );

  const buildChannelUrl = useCallback((channel: TelegramChannel | null) => {
    if (!channel) return null;
    const username = channel.entity?.username || channel.username;
    if (!username) return null;
    return `https://t.me/${username.replace(/^@/, "")}`;
  }, []);

  const fallbackChannelFromProps = useMemo(() => {
    if (!channelUrl) return null;
    const match = channelUrl.match(/https:\/\/t\.me\/([^/?]+)/i);
    if (!match || !match[1]) return null;
    const username = match[1];
    return {
      id: `from-props:${username}`,
      username,
      title: username,
      isChannel: true,
    } as TelegramChannel;
  }, [channelUrl]);

  const {
    data: channelsPages,
    error: channelsError,
    isLoading: isChannelsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchChannels,
  } = useInfiniteQuery<{ channels: TelegramChannel[] }, Error>({
    queryKey: ["markdown-editor", "channels"],
    queryFn: async ({ pageParam }) => {
      const lastChannelId = (pageParam as string) || "";
      const params = new URLSearchParams({
        myOnly: "true",
        lastChannel: lastChannelId,
      });

      const response = await fetch(
        `${API_URL}getAllChannels?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Не удалось загрузить список каналов");
      }

      return response.json();
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.channels || lastPage.channels.length === 0) {
        return undefined;
      }
      const lastChannel = lastPage.channels[lastPage.channels.length - 1];
      return lastChannel?.id || undefined;
    },
    initialPageParam: "" as string,
    refetchOnWindowFocus: false,
    enabled: isChannelModalOpen,
  });

  const availableChannels = useMemo(() => {
    const seen = new Set<string>();
    const aggregated: TelegramChannel[] = [];

    channelsPages?.pages.forEach((page) => {
      page.channels?.forEach((channel) => {
        if (channel?.id && !seen.has(channel.id)) {
          seen.add(channel.id);
          aggregated.push(channel);
        }
      });
    });

    if (activeChannel?.id && !seen.has(activeChannel.id)) {
      aggregated.unshift(activeChannel);
    }

    return aggregated.filter(
      (channel) =>
        Boolean(channel?.entity?.username) || Boolean(channel?.username)
    );
  }, [channelsPages, activeChannel]);

  const handleOpenAuthorModal = useCallback(() => {
    if (!videoSourceUrl) return;
    setAuthorLinkText((prev) => prev || "(Автор)");
    setAuthorModalOpen(true);
  }, [videoSourceUrl]);

  const handleAuthorModalSave = useCallback(() => {
    if (!videoSourceUrl) return;
    const trimmedText = authorLinkText.trim();
    if (!trimmedText) return;
    insertLinkLine(trimmedText, videoSourceUrl);
    setAuthorModalOpen(false);
  }, [authorLinkText, insertLinkLine, videoSourceUrl]);

  const handleOpenChannelModal = useCallback(() => {
    setChannelModalOpen(true);
  }, []);

  const handleChannelConfirm = useCallback(() => {
    const url = buildChannelUrl(selectedChannelForLink);
    if (!url) return;
    insertLinkLine("Подписаться", url);
    setChannelModalOpen(false);
  }, [buildChannelUrl, insertLinkLine, selectedChannelForLink]);

  const handleChannelImmediateInsert = useCallback(
    (channel: TelegramChannel) => {
      const url = buildChannelUrl(channel);
      if (!url) return;
      insertLinkLine("Подписаться", url);
      setChannelModalOpen(false);
    },
    [buildChannelUrl, insertLinkLine]
  );

  const handleRetryFetchChannels = useCallback(() => {
    refetchChannels();
  }, [refetchChannels]);

  const channelsForDisplay = useMemo(() => {
    const list = [...availableChannels];
    if (fallbackChannelFromProps) {
      const fallbackUrl = buildChannelUrl(fallbackChannelFromProps);
      const exists = list.some(
        (channel) => buildChannelUrl(channel) === fallbackUrl
      );
      if (!exists) {
        list.unshift(fallbackChannelFromProps);
      }
    }
    return list;
  }, [availableChannels, buildChannelUrl, fallbackChannelFromProps]);

  const sortedChannels = useMemo(() => {
    return [...channelsForDisplay].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [channelsForDisplay]);

  useEffect(() => {
    if (!isChannelModalOpen) return;
    setSelectedChannelForLink((current) => {
      if (current) return current;
      if (activeChannel?.id) return activeChannel;
      if (fallbackChannelFromProps) return fallbackChannelFromProps;
      if (sortedChannels.length > 0) return sortedChannels[0];
      return null;
    });
  }, [
    isChannelModalOpen,
    activeChannel,
    fallbackChannelFromProps,
    sortedChannels,
  ]);

  const canInsertAuthorLink = Boolean(videoSourceUrl);
  const canInsertSubscribeLink = true;
  const hasLoadedAnyChannels = useMemo(
    () =>
      Boolean(
        channelsPages?.pages?.some((page) => (page.channels?.length ?? 0) > 0)
      ),
    [channelsPages]
  );
  const isInitialChannelsLoading = isChannelsLoading && !hasLoadedAnyChannels;

  const clearAll = () => {
    setInternalText("");
    setEntities([]);
    handleTextChange("");
    handleEntitiesChange([]);
    if (editorRef.current) {
      editorRef.current.innerText = "";
    }
    clearHistory();
  };

  const handleInput = () => {
    const plainText = editorRef.current?.innerText || "";
    handleTextChange(plainText);
    // Добавляем в историю только если это не обновление от AI
    if (!isAiGenerating && aiResponse === undefined) {
      pushHistory(plainText, entities);
    }
  };

  // Обработка изменений текста от Hashtags компонента
  const handleHashtagsTextChange = (newText: string) => {
    // Обновляем внутреннее состояние
    if (value === undefined) {
      setInternalText(newText);
    }
    // Вызываем onChange для синхронизации с родительским компонентом
    handleTextChange(newText);

    // Обновляем HTML с текущими entities (пересчитываем offsets если нужно)
    if (editorRef.current) {
      // Обновляем entities, удаляя те, которые вышли за границы текста
      const validEntities = entities.filter(
        (e) => e.offset + e.length <= newText.length
      );

      if (validEntities.length !== entities.length) {
        setEntities(validEntities);
        onEntitiesChange?.(validEntities);
      }

      const newHTML = formatTextToHTML(newText, validEntities);
      editorRef.current.innerHTML = newHTML;
      setForceUpdate((prev) => !prev);
    }

    // Добавляем в историю undo/redo
    if (!isAiGenerating && aiResponse === undefined) {
      pushHistory(newText, entities);
    }
  };

  // Обработка обновлений от AI
  useEffect(() => {
    if (aiResponse !== undefined && editorRef.current) {
      // Обновляем текст от AI без добавления в историю
      const currentText = editorRef.current.innerText || "";

      // Обновляем только если текст действительно изменился
      // и если это обновление от AI (не от пользователя)
      if (currentText !== aiResponse) {
        // Сохраняем позицию курсора для восстановления
        const selection = window.getSelection();
        let cursorOffset = 0;
        if (selection && selection.rangeCount > 0 && !isAiGenerating) {
          // Во время генерации не сохраняем курсор, так как текст обновляется автоматически
          const range = selection.getRangeAt(0);
          const startRange = document.createRange();
          startRange.selectNodeContents(editorRef.current);
          startRange.setEnd(range.startContainer, range.startOffset);
          cursorOffset = startRange.toString().length;
        }

        // Обновляем HTML с текущими entities
        const newHTML = formatTextToHTML(aiResponse, entities);
        editorRef.current.innerHTML = newHTML;

        // Обновляем internal state если не используется controlled mode
        // Не вызываем onChange, так как aiResponse уже синхронизирован через проп
        if (value === undefined) {
          setInternalText(aiResponse);
        }

        // Восстанавливаем позицию курсора только если не идет генерация
        if (!isAiGenerating && cursorOffset > 0) {
          try {
            const newSelection = window.getSelection();
            if (newSelection && editorRef.current) {
              const walker = document.createTreeWalker(
                editorRef.current,
                NodeFilter.SHOW_TEXT,
                null
              );

              let currentOffset = 0;
              let node: Node | null;
              let targetNode: Text | null = null;
              let offsetInNode = 0;

              while ((node = walker.nextNode())) {
                const textNode = node as Text;
                const nodeLength = textNode.textContent?.length || 0;

                if (currentOffset + nodeLength >= cursorOffset) {
                  targetNode = textNode;
                  offsetInNode = cursorOffset - currentOffset;
                  break;
                }

                currentOffset += nodeLength;
              }

              if (targetNode) {
                const newRange = document.createRange();
                newRange.setStart(
                  targetNode,
                  Math.min(offsetInNode, targetNode.textContent?.length || 0)
                );
                newRange.setEnd(
                  targetNode,
                  Math.min(offsetInNode, targetNode.textContent?.length || 0)
                );
                newSelection.removeAllRanges();
                newSelection.addRange(newRange);
              }
            }
          } catch (e) {
            // Игнорируем ошибки восстановления курсора
          }
        }

        // Принудительно обновляем отображение
        setForceUpdate((prev) => !prev);
      }
    }
  }, [aiResponse, entities, isAiGenerating, value]);

  const hasText = text.length > 0;

  const handleChannelListScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const threshold = 40;
      if (
        hasNextPage &&
        !isFetchingNextPage &&
        target.scrollHeight - (target.scrollTop + target.clientHeight) <
          threshold
      ) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  return (
    <div className="markdown-editor">
      <Toolbar
        hasText={hasText}
        activeFormats={activeFormats}
        historyIndex={historyIndex}
        historyLength={history.length}
        onFormat={applyFormatting}
        onUndo={undo}
        onRedo={redo}
        onClearFormatting={clearFormatting}
        onClearAll={clearAll}
        onInsertAuthorLink={
          canInsertAuthorLink ? handleOpenAuthorModal : undefined
        }
        onInsertSubscribeLink={handleOpenChannelModal}
        canInsertAuthorLink={canInsertAuthorLink}
        canInsertSubscribeLink={canInsertSubscribeLink}
      />

      <EditorTextarea
        text={text}
        entities={entities}
        editorRef={editorRef}
        onChange={handleInput}
        onSelect={updateActiveFormats}
        forceUpdate={forceUpdate}
        onUndo={undo}
        onRedo={redo}
      />

      <Hashtags
        text={text}
        editorRef={editorRef}
        onTextChange={handleHashtagsTextChange}
        onHistoryPush={(newText) => pushHistory(newText, entities)}
      />

      <Modal
        title="Добавить ссылку на автора"
        open={isAuthorModalOpen}
        onCancel={() => setAuthorModalOpen(false)}
        onOk={handleAuthorModalSave}
        centered
        okText="Сохранить"
        cancelText="Отмена"
        okButtonProps={{ disabled: !authorLinkText.trim() }}
        destroyOnClose
      >
        <Input
          value={authorLinkText}
          onChange={(event) => setAuthorLinkText(event.target.value)}
          onPressEnter={(event) => {
            event.preventDefault();
            handleAuthorModalSave();
          }}
          placeholder="Текст, который будет показан в ссылке"
          autoFocus
        />
      </Modal>

      <Modal
        title="Добавить ссылку на канал"
        open={isChannelModalOpen}
        onCancel={() => setChannelModalOpen(false)}
        onOk={handleChannelConfirm}
        okText="Сохранить"
        centered
        cancelText="Отмена"
        okButtonProps={{
          disabled: !buildChannelUrl(selectedChannelForLink),
          loading: isInitialChannelsLoading,
        }}
      >
        {isInitialChannelsLoading ? (
          <div className="markdown-editor__channel-modal-state">
            <LoaderSpinner />
            <span>Загружаем список каналов...</span>
          </div>
        ) : channelsError && sortedChannels.length === 0 ? (
          <div className="markdown-editor__channel-modal-state">
            <span>{channelsError.message}</span>
            <Button onClick={handleRetryFetchChannels}>
              Попробовать снова
            </Button>
          </div>
        ) : sortedChannels.length === 0 ? (
          <div className="markdown-editor__channel-modal-state">
            <span>Нет доступных каналов</span>
          </div>
        ) : (
          <div
            className="markdown-editor__channel-modal-list"
            onScroll={handleChannelListScroll}
          >
            {sortedChannels.map((channel) => {
              const isSelected = selectedChannelForLink?.id === channel.id;
              const username = channel.entity?.username || channel.username;
              return (
                <button
                  key={channel.id}
                  type="button"
                  className={`markdown-editor__channel-modal-item${
                    isSelected
                      ? " markdown-editor__channel-modal-item--selected"
                      : ""
                  }`}
                  onClick={() => setSelectedChannelForLink(channel)}
                  onDoubleClick={() => handleChannelImmediateInsert(channel)}
                >
                  <div className="markdown-editor__channel-modal-item-title">
                    {channel.title || channel.entity?.title || username}
                  </div>
                  {username && (
                    <div className="markdown-editor__channel-modal-item-username">
                      @{username.replace(/^@/, "")}
                    </div>
                  )}
                  {channel.isPinned && (
                    <div className="markdown-editor__channel-modal-item-meta">
                      Закреплённый канал
                    </div>
                  )}
                </button>
              );
            })}
            {isFetchingNextPage && (
              <div className="markdown-editor__channel-modal-state">
                <LoaderSpinner />
                <span>Загружаем ещё...</span>
              </div>
            )}
            {channelsError &&
              sortedChannels.length > 0 &&
              !isFetchingNextPage && (
                <div className="markdown-editor__channel-modal-state">
                  <span>{channelsError.message}</span>
                  <Button size="small" onClick={handleRetryFetchChannels}>
                    Повторить попытку
                  </Button>
                </div>
              )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MarkdownEditor;
