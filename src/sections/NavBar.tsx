import Navbar from "@/src/components/navigation/Navbar"
import { learnMenu, topNavLinks } from "@/src/constants/navigation"

export default function NavBar() {
  return <Navbar brandName="PYTHON ARENA" learnMenu={learnMenu} links={topNavLinks} />
}
