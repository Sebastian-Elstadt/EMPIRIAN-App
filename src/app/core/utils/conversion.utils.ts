const ConversionUtils = {
    BufferToBase64(buffer: ArrayBuffer) {
        return window.btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer))));
    }
}

export default ConversionUtils;