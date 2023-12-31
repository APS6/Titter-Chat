
export default async function fetchData(endpoint) {
    try {
        const response = await fetch(`/api/${endpoint}`, {
            method: "GET",
            cache: "no-store"
        });
        if (!response.ok) {
            console.log("something went wrong");
            throw new Error("Error fetching data")
        }
        return response.json()
    } catch (error) {
        console.log("there was an error fetching data", error);
    }
}