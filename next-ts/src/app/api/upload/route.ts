import {NextRequest, NextResponse} from 'next/server';
import {PutObjectCommand, GetObjectCommand  } from '@aws-sdk/client-s3';
import {getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { r2Client } from '@/lib/r2';
import { prisma } from "@/lib/prisma";
import { checkDocumentLimit } from '@/lib/usage-limits';

export const config = {
	api: {
		bodyParser: false,
	},
};

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		// login validation
		if (!session?.user?.email) {
		    return NextResponse.json({error:"Unauthorized"}, { status: 401 });
		 }
	    const user = await prisma.user.findUnique({
	    where: { email: session.user.email },
	    });
if (!user?.id) {
  return NextResponse.json({ error: 'User ID is missing' }, { status: 401 });
}
	    // Check document limit
	    const limitCheck = await checkDocumentLimit(user.id);
	    
	    if (!limitCheck.canUpload) {
	      return NextResponse.json({
	        error: 'Upload limit exceeded',
	        message: limitCheck.message,
	        currentCount: limitCheck.currentCount,
	        maxAllowed: limitCheck.maxAllowed,
	      }, {status:403});
	    }
	    // For free users, deactivate existing documents before uploading new one
	    if (limitCheck.maxAllowed === 1 && limitCheck.currentCount > 0) {
	      await prisma.document.updateMany({
	        where: { 
	          userId: user?.id,
	          isActive: true,
	        },
	        data: { isActive: false },
	      });
	    }
		const formData = await request.formData();
		const file  = formData.get('file') as File;
		// file validation
		if(!file){
			return  NextResponse.json({error:"No file uploaded"}, { status: 400 });
		}
		// type validation
		const allowedTypes = ['application/pdf'];
		if (!allowedTypes.includes(file.type)){
			return NextResponse.json({error: 'File type not allowed'}, {status:400})
		}
		// size validation
		const maxSize = 5 * 1024 * 1024; // 5MB 
		if (file.size > maxSize){
			return NextResponse.json({error: `File too large for ${maxSize}`}, {status:400})
		}

		const fileBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(fileBuffer);
		const key = `${Date.now()}-${file.name}`;

		const params = {
			Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
			Key: key,
			name: file.name,
			Body: buffer,
			ContentType: file.type || 'application/octet-stream',
		}

		const command = new PutObjectCommand(params)
		await r2Client.send(command);
const getObjectCommand = new GetObjectCommand({
  Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
  Key: key,
});

const url = await getSignedUrl(r2Client, getObjectCommand, { expiresIn: 3600 });
	    const document_ = await prisma.document.create({
		    data: {
		      name: file.name,
		      key: key,
		      size: file.size,
		      userId: user?.id,
		      type: file.type

		    },
	  });
const headers: Record<string, string> = {
  'X-API-Key': process.env.CHAT_API_KEY ?? "",
  'Content-Type': 'application/json'
};

		try {
			const vectorDbResponse = await fetch(process.env.CHAT_URL+'/add-record', {
				method: 'POST',
				headers,
				body: JSON.stringify({
					documentId: document_.id,
					userId: user?.id,
					documentUrl: url
				})
			});

			if (!vectorDbResponse.ok) {
				throw new Error('Vector DB upload failed');
			}

			const vectorData = await vectorDbResponse.json();
			// Update the document with vector database information
			await prisma.document.update({
				where: {
					id: document_.id
				},
				data: {
					indexName: vectorData.indexName,
					namespace: vectorData.namespace
				}
			});

			return NextResponse.json({
				...document_,
				url,
			});
		} catch (vectorError) {
			console.error('Vector DB upload error:', vectorError);
			// Optionally delete the uploaded document if vector DB upload fails
			await prisma.document.delete({
				where: { id: document_.id }
			});
			return NextResponse.json({ error: "Vector DB upload failed" }, { status: 500 });
		}

	} catch (error){
		console.error('Upload error: ', error);
		return NextResponse.json({error:"Upload failed"}, { status: 500 });

	}
}