import { GoLinkProps } from "@/app/go/GoLink";

/**
 * stub
 */
export function filterGoLinks (filter: string, goLinkData: GoLinkProps[]): GoLinkProps[] {
    filter = filter.toLowerCase()

    let filteredPinned = goLinkData.filter((element) => {
        let name = element.goUrl.toLowerCase()
        let desc = element.description.toLowerCase()
        if((name.includes(filter) || desc.includes(filter)) && element.pinned) {
            return element
        }
    })

    let filteredUnpinned = goLinkData.filter((element) => {
        let name = element.goUrl.toLowerCase()
        let desc = element.description.toLowerCase()
        if((name.includes(filter) || desc.includes(filter)) && !element.pinned) {
            return element
        }
    })
    
    return [...filteredPinned, ...filteredUnpinned]
}