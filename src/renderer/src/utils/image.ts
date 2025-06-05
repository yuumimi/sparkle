export async function cropAndPadTransparent(
  base64: string,
  finalSize = 256,
  border = 24
): Promise<string> {
  const img = new Image()
  img.src = base64
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
  })

  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0)

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  if (isWindowsDefaultIcon(imgData)) {
    const outCanvas = document.createElement('canvas')
    outCanvas.width = finalSize
    outCanvas.height = finalSize
    const outCtx = outCanvas.getContext('2d')!
    outCtx.clearRect(0, 0, finalSize, finalSize)

    const targetSize = finalSize - 2 * border
    outCtx.drawImage(img, 0, 0, img.width, img.height, border, border, targetSize, targetSize)
    return outCanvas.toDataURL('image/png')
  }

  const { data, width, height } = imgData
  let top = height,
    bottom = 0,
    left = width,
    right = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4 + 3
      if (data[i] > 10) {
        if (x < left) left = x
        if (x > right) right = x
        if (y < top) top = y
        if (y > bottom) bottom = y
      }
    }
  }

  if (right < left || bottom < top) return base64

  const cropWidth = right - left + 1
  const cropHeight = bottom - top + 1
  const contentSize = finalSize - 2 * border

  const outCanvas = document.createElement('canvas')
  outCanvas.width = finalSize
  outCanvas.height = finalSize
  const outCtx = outCanvas.getContext('2d')!
  outCtx.clearRect(0, 0, finalSize, finalSize)
  outCtx.drawImage(
    canvas,
    left,
    top,
    cropWidth,
    cropHeight,
    border,
    border,
    contentSize,
    contentSize
  )

  return outCanvas.toDataURL('image/png')
}

function isWindowsDefaultIcon(imgData: ImageData): boolean {
  const { data, width, height } = imgData

  const centerX = Math.floor(width / 2)
  const centerY = Math.floor(height / 2)
  const centerIndex = (centerY * width + centerX) * 4

  const r = data[centerIndex]
  const g = data[centerIndex + 1]
  const b = data[centerIndex + 2]

  const isBlue = r < 100 && g < 150 && b > 180

  let grayStripeCount = 0
  for (let y = 0; y < height; y++) {
    const left = (y * width + 4) * 4
    const right = (y * width + width - 5) * 4
    const lrAvg = (i: number): number => (data[i] + data[i + 1] + data[i + 2]) / 3

    const leftGray = lrAvg(left)
    const rightGray = lrAvg(right)

    if (leftGray > 150 && rightGray > 150) grayStripeCount++
  }

  return isBlue && grayStripeCount > height * 0.5
}
