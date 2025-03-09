// 接收主线程消息
worker.onMessage((message) => {
  const { searchText, cardBoxes, folders } = message

  if (!searchText) {
    worker.postMessage({
      type: 'result',
      data: {
        filteredCardBoxesMap: {},
        filteredFolders: [],
      },
    })
    return
  }

  const searchTextRegex = new RegExp(searchText, 'giu')
  const resultMap = {}

  // 遍历所有卡盒进行搜索
  Object.entries(cardBoxes).forEach(([cardBoxId, cardBox]) => {
    const matchedCardItems = Object.entries(cardBox.cardItems)
      .map(([cardItemId, cardItem]) => {
        const frontMatches = []
        const backMatches = []
        let match

        // 搜索正面内容
        while ((match = searchTextRegex.exec(cardItem.frontContent)) !== null) {
          frontMatches.push({
            startIndex: match.index,
            endIndex: match.index + match[0].length,
          })
        }

        // 重置正则并搜索背面内容
        searchTextRegex.lastIndex = 0
        while ((match = searchTextRegex.exec(cardItem.backContent)) !== null) {
          backMatches.push({
            startIndex: match.index,
            endIndex: match.index + match[0].length,
          })
        }

        const isMatched = frontMatches.length > 0 || backMatches.length > 0
        if (!isMatched) return null

        return {
          ...cardItem,
          id: cardItemId,
          frontMatches,
          backMatches,
        }
      })
      .filter(Boolean)

    if (matchedCardItems.length > 0) {
      const folderId = cardBox.folderId || 'default'
      if (!resultMap[folderId]) {
        resultMap[folderId] = {
          folderId,
          folderName: cardBox.folderName || '默认目录',
          cardBoxes: [],
        }
      }

      resultMap[folderId].cardBoxes.push({
        ...cardBox,
        id: cardBoxId,
        cardItems: matchedCardItems,
      })
    }
  })

  // 处理文件夹过滤
  const filteredFolders = Object.entries(resultMap)
    .filter(([, folder]) => folder.cardBoxes.length > 0)
    .map(([folderId]) => ({
      id: folderId,
      name: folders[folderId]?.name || '默认目录',
    }))

  // 发送结果回主线程
  worker.postMessage({
    type: 'result',
    data: {
      filteredCardBoxesMap: resultMap,
      filteredFolders,
    },
  })
})
