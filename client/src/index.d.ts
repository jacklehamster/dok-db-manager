import type { DbApi } from "@dobuki/data-client";
interface Props {
    rootUrl: string;
    user: string;
    type: string;
    session: string;
}
export declare class DokDb implements DbApi {
    rootUrl: string;
    user: string;
    token?: string;
    session?: string;
    type: string;
    constructor({ rootUrl, user, type, session }: Props);
    listKeys(subfolder?: string, branch?: string, recursive?: boolean): Promise<any>;
    getData(key: string): Promise<{
        data: any;
        type?: string | null;
        sha: string | null;
    }>;
    setData(key: string, valueOrCall: any): Promise<any>;
}
export {};
