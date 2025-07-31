import {NextRequest, NextResponse} from 'next/server';
import {getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {GetObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '@/lib/r2';
import { prisma } from "@/lib/prisma";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const config = {
	api: {
		bodyParser: false,
	},
};


export async function GET(req: Request) {
  	  const session = await getServerSession(authOptions);

	  if (!session?.user?.email) {
	    return NextResponse.json({error:"Unauthorized"}, { status: 401 });
	  }
	  const documents = await prisma.document.findMany({
	    where: {
	      user: { email: session.user.email },
	    }
	  });
	  if(documents.length === 0){

	  	return  NextResponse.json({
	  		documents: [],
	  		message: 'No documents found'
	  	});

	  }
	  const documentsWithSignedUrls = await Promise.all(
	  	documents.map(async (document)=> {
	  		try {
	  			const command =  new GetObjectCommand({
					Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
					Key: document.key || document.name,
				});
				const url = await getSignedUrl(r2Client, command, {expiresIn: 3600 })
				return {
					...document,
					url,
				};
	  		} catch (error){
	  			console.error('Error generated siged URL for document')
	  			return {
	  				...document,
	  				url: null,
	  			};
	  		}
	  	})
	  	);
	  return NextResponse.json({
	   	documents: documentsWithSignedUrls,
	   	total: documentsWithSignedUrls.length,
	   })

	
}
