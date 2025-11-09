import { Entity } from "../types";

/**
 * Преобразует текст с entities в HTML для contentEditable
 */
export const formatTextToHTML = (rawText: string, entities: Entity[]): string => {
  const htmlParts: string[] = [];

  for (let i = 0; i < rawText.length; i++) {
    let openTags = "";
    let closeTags = "";

    entities.forEach((e) => {
      if (i === e.offset) {
        switch (e.type) {
          case "bold":
            openTags += "<b>";
            break;
          case "italic":
            openTags += "<i>";
            break;
          case "underline":
            openTags += "<u>";
            break;
          case "strikethrough":
            openTags += "<s>";
            break;
          case "spoiler":
            openTags += `<span class="spoiler">`;
            break;
          case "code":
            openTags += "<code>";
            break;
          case "text_url":
            openTags += `<a href="${e.url}" target="_blank">`;
            break;
        }
      }
      if (i === e.offset + e.length) {
        switch (e.type) {
          case "bold":
            closeTags = "</b>" + closeTags;
            break;
          case "italic":
            closeTags = "</i>" + closeTags;
            break;
          case "underline":
            closeTags = "</u>" + closeTags;
            break;
          case "strikethrough":
            closeTags = "</s>" + closeTags;
            break;
          case "spoiler":
            closeTags = `</span>` + closeTags;
            break;
          case "code":
            closeTags = "</code>" + closeTags;
            break;
          case "text_url":
            closeTags = "</a>" + closeTags;
            break;
        }
      }
    });

    // Преобразуем перенос строки в <br>
    if (rawText[i] === "\n") {
      htmlParts.push(closeTags + openTags + "<br>");
    } else {
      htmlParts.push(closeTags + openTags + rawText[i]);
    }
  }

  // Закрываем теги в конце
  entities.forEach((e) => {
    const end = e.offset + e.length;
    if (end === rawText.length) {
      switch (e.type) {
        case "bold":
          htmlParts.push("</b>");
          break;
        case "italic":
          htmlParts.push("</i>");
          break;
        case "underline":
          htmlParts.push("</u>");
          break;
        case "strikethrough":
          htmlParts.push("</s>");
          break;
        case "spoiler":
          htmlParts.push("</span>");
          break;
        case "code":
          htmlParts.push("</code>");
          break;
        case "text_url":
          htmlParts.push("</a>");
          break;
      }
    }
  });

  return htmlParts.join("");
};

