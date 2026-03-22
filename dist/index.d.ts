export interface OpenClawSkill {
    name: string;
    description: string;
    handler: (context: any) => Promise<void>;
}
export declare class OpenClawGateway {
    registerSkill(skill: OpenClawSkill): void;
    initialize(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map