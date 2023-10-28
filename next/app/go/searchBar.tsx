export default function searchBar() {
    return (
        <div className="searchBar">
            <input type="text" placeholder="Search.." name="search" />
            <button type="submit"><i className="fa fa-search"></i></button>
        </div>
    )
}