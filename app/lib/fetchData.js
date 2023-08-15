
export default async function fetchData(endpoint) {
    try {
        const response = await fetch(`/api/${endpoint}`, {
            method: "GET",
            cache: "no-store"
        });
        if (response.status !== 200) {
            console.log("something went wrong");
        }
        console.log(response.json())
        return response.json()
    } catch (error) {
        console.log("there was an error fetching users", error);
    }
}