class apiError extends Error{
    constructor(
        statusCode,
        message = ("Something went wrong"),
        errors =[],
        statck = ""
    ){
        super(message)
        this.data = null
        this.statusCode = statusCode
        this.success = false
        this.message = message 
        this.errors = errors

    }
}
export {apiError}