export interface ZCardContent {
    getAlt(): string,
    getImageSrc(): string,
    toContent(): React.FC;
}