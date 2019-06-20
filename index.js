/* global DOMParser */
import { createElement } from 'react'
export default class ComponentBuilder {
  constructor(options) {
    this.options = options || {}
    this.componentMap = this.options || []
    this.attributeMapping = {
      class: 'className',
      for: 'htmlFor',
      crossorigin: 'crossOrigin',
      srclang: 'srcLang',
      accesskey: 'accessKey',
    }
    this.selfClosingTags = {
      area: true,
      base: true,
      br: true,
      col: true,
      embed: true,
      hr: true,
      img: true,
      input: true,
      keygen: true,
      link: true,
      meta: true,
      param: true,
      source: true,
      track: true,
      wbr: true,
    }
  }
  getKey() {
    return `key-${new Date().valueOf()}-${Math.ceil(Math.random() * 99999999)}`
  }
  build(html) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    return this.getReactComponent(doc.body.firstChild)
  }
  getReactComponent(root) {
    if (root && root.childNodes) {
      const componentInfo = this.getComponentInfoFromNode(root)
      if (componentInfo !== null) {
        if (componentInfo.selfClosing) {
          return createElement(componentInfo.use, this.getProps(root, componentInfo.withProps))
        }
        return createElement(
          componentInfo.use,
          this.getProps(root, componentInfo.withProps),
          this.getChildren(root.childNodes)
        )
      }
    }
    return null
  }
  getComponentInfoFromNode(node) {
    const componentMap = Array.isArray(this.componentMap) ? this.componentMap : []
    for (const mapItem of componentMap) {
      if (typeof mapItem.when === 'function' && mapItem.when(node)) {
        if (mapItem.ignore) {
          return null
        }
        return {
          use: mapItem.use,
          withProps: mapItem.withProps || {},
          selfClosing: mapItem.selfClosing || false,
        }
      }
    }
    const tagName = (node.tagName || '').toLowerCase()
    return {
      use: tagName,
      withProps: {},
      selfClosing: this.selfClosingTags[tagName] || false,
    }
  }
  getChildren(children) {
    let childComponents = []
    for (var node of children || []) {
      if (node.nodeType === 3) {
        childComponents.push(this.removeExtraSpaces(node.data))
      } else if (node.tagName) {
        childComponents.push(this.getReactComponent(node))
      }
    }
    return childComponents
  }
  getProps(node, defaultProps = {}) {
    let props = {
      key: getKey(),
    }
    if (node.attributes && node.attributes.length > 0) {
      for (let key in node.attributes) {
        if (node.attributes.hasOwnProperty(key)) {
          const attribute = node.attributes[key]
          const attributeName = this.attributeMapping[attribute.nodeName] || attribute.nodeName
          props[attributeName] = attribute.nodeValue
        }
      }
    }
    return Object.assign(defaultProps, props)
  }
  removeExtraSpaces(data) {
    return (data || '').replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ')
  }
}
