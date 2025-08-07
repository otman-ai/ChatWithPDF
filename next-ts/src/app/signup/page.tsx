import {COLORS} from "@/constants";
import { GoogleSign } from "@/components/Buttons";
import { Github } from "lucide-react";

const Signup = ()=>{
   return (
      <div className={` overflow-hidden ${COLORS.surface} w-full h-screen flex flex-col justify-center items-center`}>
       <div className='justify-center items-center flex p-6 space-y-6'>
        <div className="lg:flex justify-center lg:space-y-0 space-y-4 lg:space-x-4 mb-6">
          <GoogleSign/>

          <a
          href='https://github.com/otman-ai/ChatWithPDF'
          target='_blank'
          rel='noopener noreferrer'
          className={`flex items-center space-x-2 px-4 py-2 ${COLORS.accentSecondary} ${COLORS.textSecondary} rounded-lg transition-colors font-medium`}
        >
        <span className="">Open source</span>
        <Github className="w-4 h-4" />
        </a>
        </div>
       </div>


      </div>
)
}
export default Signup;