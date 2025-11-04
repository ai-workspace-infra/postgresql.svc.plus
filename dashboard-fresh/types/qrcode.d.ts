declare module 'qrcode' {
  export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

  export type QRCodeColorOptions = {
    dark?: string
    light?: string
  }

  export type QRCodeToDataURLOptions = {
    errorCorrectionLevel?: ErrorCorrectionLevel
    margin?: number
    scale?: number
    width?: number
    color?: QRCodeColorOptions
  }

  export function toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>
}
