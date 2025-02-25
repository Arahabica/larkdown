import { MainConverter } from './converter/MainConverter'
import { MarkDownParser } from './markdown/MarkDownParser'
import { messagingApi } from '@line/bot-sdk'
import {
  FlexConverter,
  TextType,
  ConvertOptions,
  ConvertFlexMessageOptions,
} from './types'
/**
 * markdown-flex-message is a converter that transforms Markdown into Flex Message for the LINE Messaging API.
 */
export class MarkdownFlexMessage {
  parser: MarkDownParser
  converter: FlexConverter

  constructor() {
    this.parser = new MarkDownParser()
    this.converter = new MainConverter()
  }
  /**
   * Convert markdown text to flex message
   * @param {string} markdown Markdown text
   * @param {ConvertOptions|undefined} options Options for flex message
   * @params {string|undefined} options.altText Alternative text for flex message. If not specified, it becomes the first 100 characters of the Markdown text.
   * @params {string|undefined} options.size Size of flex message. Default is 'giga'.
   *
   * @returns {Promise<messagingApi.FlexMessage>} [Flex message](https://developers.line.biz/en/reference/messaging-api/#flex-message)
   */
  async convertToFlexMessage(
    markdown: string,
    options: ConvertFlexMessageOptions = {},
  ): Promise<{ flexMessage: messagingApi.FlexMessage; textType: TextType }> {
    const { flexBubble, textType } = await this.convertToFlexBubble(
      markdown,
      options,
    )
    const altText = options.altText || markdown.slice(0, 100)
    const flexMessage: messagingApi.FlexMessage = {
      type: 'flex',
      altText,
      contents: flexBubble,
    }
    return { flexMessage, textType }
  }
  /**
   * Convert markdown text to flex bubble object
   * @param {string} markdown Markdown text
   * @param {ConvertOptions|undefined} options Options for flex message
   * @params {string|undefined} options.size Size of flex message. Default is 'giga'.
   *
   * @returns {Promise<messagingApi.FlexBubble>} [Flex Bubble](https://developers.line.biz/en/reference/messaging-api/#bubble)
   */
  async convertToFlexBubble(
    markdown: string,
    options: ConvertOptions = {},
  ): Promise<{ flexBubble: messagingApi.FlexBubble; textType: TextType }> {
    const { flexBox, textType } = await this.convert(markdown)
    if (textType === 'code') {
      flexBox.paddingAll = 'none'
    } else {
      flexBox.paddingAll = 'xl'
    }
    const flexBubble: messagingApi.FlexBubble = {
      type: 'bubble',
      size: this.getRootSize(options),
      styles: {
        body: {
          separator: true,
        },
      },
      body: flexBox,
    }
    return { flexBubble, textType }
  }
  /**
   * Convert markdown text to flex bubble object
   * @param {string} markdown Markdown text
   * @returns {Promise<messagingApi.FlexBox>} [Flex box](https://developers.line.biz/en/reference/messaging-api/#box)
   */
  async convertToFlexBox(
    markdown: string,
  ): Promise<{ flexBox: messagingApi.FlexBox; textType: TextType }> {
    const { flexBox, textType } = await this.convert(markdown)
    flexBox.paddingAll = 'none'
    return { flexBox, textType }
  }
  private async convert(
    markdown: string,
  ): Promise<{ flexBox: messagingApi.FlexBox; textType: TextType }> {
    const flexBox: messagingApi.FlexBox = {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      contents: [],
    }
    const { tokensList, textType } = this.parser.parse(markdown)
    for (const token of tokensList) {
      const contents = await this.converter.convert(token)
      for (const content of contents) {
        const simplifiedContent = JSON.parse(JSON.stringify(content))
        flexBox.contents.push(simplifiedContent)
      }
    }
    return { flexBox, textType }
  }
  private getRootSize(
    options: ConvertOptions,
  ): 'nano' | 'micro' | 'kilo' | 'giga' | undefined {
    if (options.size === 'mega') {
      return undefined
    } else if (options.size) {
      return options.size
    }
    return 'giga'
  }
}
