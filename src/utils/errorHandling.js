import toast from "react-hot-toast"

export const ErrorHandeling = (error) => {
    console.log(error)
    return toast.error(error?.response?.data?.message)
}