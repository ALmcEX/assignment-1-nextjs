import { CourseCatalog } from '@/src/components/course-list';
import { getCourses } from '@/src/lib/courses';
import type { Course } from '@/src/lib/courses';
import { createServerSupabaseClient } from '@/src/lib/supabase/server';
export default async function Courses(){const supabase=await createServerSupabaseClient();const {data:{user}}=await supabase.auth.getUser();let courses:Course[]=[];let hasError=false;try{courses=await getCourses();}catch{hasError=true;}return <CourseCatalog courses={courses} hasError={hasError} user={user}/>;}
