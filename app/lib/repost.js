export default async function sendRepost(replyTo, accessToken) {
      const body = {
        content: "",
        replyToId: replyTo,
        images: [],
      };
      try {
        const response = await fetch("/api/Posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: accessToken,
          },
          body: JSON.stringify(body),
        });
        if (response.status !== 200) {
          console.log("something went wrong");
        } else {
            toast.success("Repost added successfully");
        }
      } catch (error) {
        console.log("there was an error submitting", error);
      }
    
  };
