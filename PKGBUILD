pkgbase=libnvidia-container
pkgname=(libnvidia-container1 
        libnvidia-container-tools 
        nvidia-container-runtime 
        nvidia-container-toolkit 
        nvidia-container-toolkit-base 
        nvidia-docker2)

pkgver=1.14.3
pkgrel=1
_elfver=0.7.1
_nvmpver=495.44
_pkgname_tools=libnvidia-container-tools
pkgdesc='NVIDIA container runtime library'
arch=('x86_64')
url='https://github.com/NVIDIA/libnvidia-container'
license=('Apache')
depends=(libcap libseccomp libtirpc)

source=("https://nvidia.github.io/libnvidia-container/stable/deb/amd64/./${pkgname[0]}_${pkgver}-1_amd64.deb" 
        "https://nvidia.github.io/libnvidia-container/stable/deb/amd64/./${pkgname[1]}_${pkgver}-1_amd64.deb" 
        "https://nvidia.github.io/libnvidia-container/stable/deb/amd64/./${pkgname[2]}_3.14.0-1_all.deb" 
        "https://nvidia.github.io/libnvidia-container/stable/deb/amd64/./${pkgname[3]}_${pkgver}-1_amd64.deb" 
        "https://nvidia.github.io/libnvidia-container/stable/deb/amd64/./${pkgname[4]}_${pkgver}-1_amd64.deb" 
        "https://nvidia.github.io/libnvidia-container/stable/deb/amd64/./${pkgname[5]}_2.14.0-1_all.deb")
sha256sums=('45fbd94f30bed5bca491ef8e893291e9e946a7ea0fe667be55357a250af9fb25'
            '736138e919ada12d7fffcffa226bb3577e4cb29df013ff45da01dc08d33b4764'
            'fe425ba3a1008748b123ce0cc50835b4a29f4000df5a88d7b22479514a8fb795'
            'a0faabb6633bffb4115f8912de1c21727c9b8cb35fd3c943f0ffd6dd2a021d0f'
            '65187a56fe483e0146c6c613da4e5d113be1f5b18c2ea607b8c1a30edd971afc'
            'f4d01406e7e38ce810c0b3ba44c56842abc1ee38affa4c6a8a56da7989f17b2e')

prepare() {
  for package in "${pkgname[@]}"; do
    mkdir -p "$srcdir/${package}/"
    if [[ "${package}" -eq "nvidia-container-toolkit" ]]; then
      ar -xv "${package}"_*.deb; ls -al; tar -xf "data.tar.xz" -C "$srcdir/${package}/"
    else
      tar -xf "${package}"_*.tar.zst -C "$srcdir/${package}/"
    fi
  done
}

install_pkg() {
  cd "${1}"
  find usr/bin -type f -exec install -Dm755 "{}" "$pkgdir/{}" \; || true
  find usr/lib -type f -exec install -Dm755 "{}" "$pkgdir/{}" \; || true
  find usr/share -type f -exec install -Dm755 "{}" "$pkgdir/{}" \; || true
  find etc -type f -exec install -Dm755 "{}" "$pkgdir/{}" \; || true
}

package_libnvidia-container1() {
  install_pkg "$srcdir/${pkgname[0]}"
}

package_libnvidia-container-tools() {
  install_pkg "$srcdir/${pkgname[1]}"
}
package_nvidia-container-runtime(){
  install_pkg "$srcdir/${pkgname[2]}"
}
package_nvidia-container-toolkit(){
  install_pkg "$srcdir/${pkgname[3]}"
}
package_nvidia-container-toolkit-base(){
  install_pkg "$srcdir/${pkgname[4]}"
}
package_nvidia-docker2(){
  install_pkg "$srcdir/${pkgname[5]}"
}
