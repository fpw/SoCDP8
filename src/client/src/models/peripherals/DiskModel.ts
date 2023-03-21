export interface DiskModel {
    getDiskCount(): number;
    getDiskSize(): number;
    getDumpExtension(): string;
    downloadDump(unit: number): Promise<Uint8Array>;
    uploadDump(unit: number, dump: Uint8Array): Promise<void>;
}
