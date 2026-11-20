const QUIET_ZONE = 4
const TARGET_WIDTH = 480
const LOGO_FRACTION = 0.2
const QR_COLORS = {
  black: { dark: '#000000', light: '#ffffff' },
  white: { dark: '#ffffff', light: '#000000' },
}

async function loadLogo(source) {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.src = source
  await image.decode()
  return image
}

function drawLogo(context, image, center, radius, backgroundColor) {
  context.fillStyle = backgroundColor
  context.beginPath()
  context.arc(center, center, radius, 0, Math.PI * 2)
  context.fill()

  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight)
  const photoRadius = radius * 0.82
  context.save()
  context.beginPath()
  context.arc(center, center, photoRadius, 0, Math.PI * 2)
  context.clip()
  context.drawImage(
    image,
    (image.naturalWidth - sourceSize) / 2,
    (image.naturalHeight - sourceSize) / 2,
    sourceSize,
    sourceSize,
    center - photoRadius,
    center - photoRadius,
    photoRadius * 2,
    photoRadius * 2,
  )
  context.restore()
}

function preserveReservedModules(context, modules, scale, center, radius, color) {
  const first = Math.max(0, Math.floor((center - radius) / scale) - QUIET_ZONE)
  const last = Math.min(modules.size - 1, Math.floor((center + radius) / scale) - QUIET_ZONE)
  for (let row = first; row <= last; row += 1) {
    for (let column = first; column <= last; column += 1) {
      if (!modules.isReserved(row, column)) continue
      context.fillStyle = modules.get(row, column) ? color.dark : color.light
      context.fillRect((column + QUIET_ZONE) * scale, (row + QUIET_ZONE) * scale, scale, scale)
    }
  }
}

export async function createProfileQr(url, logoSrc, variant = 'black') {
  const { default: qr } = await import('qrcode')
  const color = QR_COLORS[variant]
  const renderWithoutLogo = async (errorCorrectionLevel) => ({
    png: await qr.toDataURL(url, {
      width: TARGET_WIDTH,
      margin: QUIET_ZONE,
      errorCorrectionLevel,
      color,
    }),
    hasLogo: false,
  })
  if (!logoSrc) return renderWithoutLogo('M')

  const symbol = qr.create(url, { errorCorrectionLevel: 'H' })
  const scale = Math.max(1, Math.floor(TARGET_WIDTH / (symbol.modules.size + QUIET_ZONE * 2)))
  const canvas = await qr.toCanvas(url, {
    scale,
    margin: QUIET_ZONE,
    errorCorrectionLevel: 'H',
    version: symbol.version,
    maskPattern: symbol.maskPattern,
    color,
  })
  try {
    const image = await loadLogo(logoSrc)
    const center = canvas.width / 2
    const radius = (symbol.modules.size * scale * LOGO_FRACTION) / 2
    const context = canvas.getContext('2d')
    drawLogo(context, image, center, radius, color.light)
    preserveReservedModules(context, symbol.modules, scale, center, radius, color)
    return { png: canvas.toDataURL('image/png'), hasLogo: true }
  } catch {
    return renderWithoutLogo('H')
  }
}
