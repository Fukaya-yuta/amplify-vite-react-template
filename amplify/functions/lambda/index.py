def  handler ( event, context ): 
    print ( "Event: " , event) 

    return { 
        'statusCode' : 200 , 
        'body' : 'Hello from Lambda!'
    }