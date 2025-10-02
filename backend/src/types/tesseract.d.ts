declare module 'tesseract.js' {
    interface RecognizeData {
        text?: string;
    }

    interface RecognizeResult {
        data: RecognizeData;
    }

    interface TesseractStatic {
        recognize(
            image: string | ArrayBuffer | Uint8Array,
            lang?: string,
            options?: Record<string, unknown>
        ): Promise<RecognizeResult>;
    }

    const Tesseract: TesseractStatic;
    export default Tesseract;
}
