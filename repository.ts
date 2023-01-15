import {
    BatchWriteItemCommand,
    BatchWriteItemInput,
    DynamoDBClient,
    QueryCommand,
    QueryCommandInput,
    QueryCommandOutput,
    UpdateItemCommand,
    UpdateItemCommandInput,
    WriteRequest
} from "@aws-sdk/client-dynamodb";
import {marshall, unmarshall} from "@aws-sdk/util-dynamodb";
import {ApiError, Compliment} from "./models";
import {SdkError} from "@aws-sdk/types";
import {getIamToken, Token} from "./iam";
import {HttpRequest} from "@aws-sdk/protocol-http";

const COMPLIMENTS_TABLE = "compliments";

const ddbClient = new DynamoDBClient({
    region: "ru-central-1",
    endpoint: process.env.DOCUMENT_API_ENDPOINT
});

export async function saveCompliment(compliment: Compliment): Promise<Compliment | ApiError> {
    const params: UpdateItemCommandInput = {
        TableName: COMPLIMENTS_TABLE,
        Key: {
            "compliment_id": {
                "N": compliment.compliment_id.toString()
            }
        },
        UpdateExpression: "SET " +
            "content = :content, ",
        ExpressionAttributeValues: {
            ":content": {"S": compliment.content},
        }
    };

    console.debug("Save compliment...");
    try {
        await callWithToken(() => ddbClient.send(new UpdateItemCommand(params)));
        console.debug(`Save compliment compliment_id=${compliment.compliment_id}, content=${compliment.content}`);
        return compliment;
    } catch (e) {
        console.error("Failed to save compliment: ", e);
        return {message: (e as SdkError).message} as ApiError;
    }
}

export async function batchWriteCompliments(compliments: Compliment[]): Promise<number | ApiError> {
    const requests: WriteRequest[] = compliments.map(compliment => {
        return {
            PutRequest: {
                Item: marshall(compliment)
            }
        } as WriteRequest
    });

    const params: BatchWriteItemInput = {
        RequestItems: {
            "compliments": requests
        }
    };

    try {
        await callWithToken(() => ddbClient.send(new BatchWriteItemCommand(params)));
        console.debug(`Wrote ${compliments.length} compliments`);
        return compliments.length;
    } catch (e) {
        console.error("Failed to write compliments: ", e);
        return {message: (e as SdkError).message} as ApiError;
    }
}

export async function getCompliments(limit?: number): Promise<Compliment[] | ApiError> {
    const params: QueryCommandInput = {
        TableName: COMPLIMENTS_TABLE,
    };

    try {
        const result: QueryCommandOutput = await callWithToken(() => ddbClient.send(new QueryCommand(params)));
        return result.Items ? result.Items.map(value => unmarshall(value) as Compliment) : [];
    } catch (e) {
        console.error("Failed to get compliments: ", e);
        return {message: (e as SdkError).message} as ApiError;
    }
}

function callWithToken(operation: () => Promise<any>): Promise<any> {
    ddbClient.middlewareStack.add(
        (next) => async (arguments_) => {
            const request = arguments_.request as HttpRequest;
            const token: Token = await getIamToken();
            request.headers["Authorization"] = "Bearer " + token.access_token;
            return next(arguments_);
        },
        {
            step: "finalizeRequest",
        }
    );
    return operation.apply({});
}