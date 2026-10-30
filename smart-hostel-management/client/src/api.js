const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export async function api(path, options={}) {
 const token=sessionStorage.getItem("hostel_token");
 const isForm=typeof FormData!=="undefined" && options.body instanceof FormData;
 const headers={...(isForm?{}:{"Content-Type":"application/json"}),...(token?{Authorization:`Bearer ${token}`} : {}),...(options.headers||{})};
 const res=await fetch(`${API}${path}`,{...options,headers});
 const data=await res.json().catch(()=>({message:"Unexpected server response"}));
 if(!res.ok)throw new Error(data.message||"Request failed");
 return data;
}
export async function openProtectedFile(path) {
 const token=sessionStorage.getItem("hostel_token");
 const res=await fetch(`${API}${path}`,{headers:token?{Authorization:`Bearer ${token}`}:{}});
 if(!res.ok){const data=await res.json().catch(()=>({message:"Could not open this file."}));throw new Error(data.message||"Could not open this file.");}
 const blob=await res.blob();const url=URL.createObjectURL(blob);window.open(url,"_blank","noopener,noreferrer");setTimeout(()=>URL.revokeObjectURL(url),60000);
}
