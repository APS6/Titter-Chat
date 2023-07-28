export default async function fetchData(endpoint) {
    try {
        const response = await fetch(`/api/${endpoint}`, {
            method: "GET"
        });
        if (response.status !== 200) {
            console.log("something went wrong");
        } else {
            console.log("Fetched Data successfully");
        }
        return response.json()
    } catch (error) {
        console.log("there was an error fetching users", error);
    }
}