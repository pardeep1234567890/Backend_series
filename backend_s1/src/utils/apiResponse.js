// A class called apiResponse that helps to create a standard format for sending API responses from your backend (like in an Express.js app).
class apiResponse {
    constructor(statusCode,data,message="success"){
        this.statusCode = statusCode
        this.data= data
        this.message = message
        this.success = statusCode<400
    }
}

export {apiResponse} 