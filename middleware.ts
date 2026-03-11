import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/admin/login",
  },
});

export const config = {
  matcher: ["/admin/dashboard/:path*", "/admin/members/:path*", "/admin/events/:path*", "/admin/news/:path*", "/admin/committee/:path*"],
};
