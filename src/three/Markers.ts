import {
  AdditiveBlending,
  type Camera,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  type PerspectiveCamera,
  Quaternion,
  Raycaster,
  RingGeometry,
  SphereGeometry,
  Vector2,
  Vector3,
} from 'three'
import { CITIES, cityIndexForProgress } from '../cities'
import { clamp01, damp, smoothstep } from '../core/damp'
import type { Theme } from '../cities/themes'
import { GLOBE_RADIUS } from './Camera'
import { latLonToVector3 } from './Globe'

/**
 * City markers.
 *
 * A slim light shaft rising from the surface with a faint ring at its base.
 * A flat dot would be almost invisible at the limb and a poor click target;
 * a shaft reads at any rotation and gives the active state somewhere to go.
 *
 * Far-side markers fade out on the limb rather than popping: the depth buffer
 * hides them behind the sphere, and a dot-product fade softens the crossing so
 * there is no hard edge at the silhouette.
 */

const SHAFT_BASE_HEIGHT = 0.055
const SHAFT_ACTIVE_HEIGHT = 0.14
const PICK_RADIUS = 0.06

interface Marker {
  readonly index: number
  readonly root: Object3D
  readonly shaft: Mesh
  readonly ring: Mesh
  readonly shaftMaterial: MeshBasicMaterial
  readonly ringMaterial: MeshBasicMaterial
  readonly pick: Mesh
  /** Outward surface normal, in globe-local space. */
  readonly normal: Vector3
  /** Damped 0..1 activation. */
  activation: number
}

export class Markers {
  readonly group = new Group()

  private readonly markers: Marker[] = []
  private readonly raycaster = new Raycaster()
  private readonly pickTargets: Mesh[] = []
  private readonly worldNormal = new Vector3()
  private readonly cameraDir = new Vector3()
  private readonly accent = new Color()

  constructor() {
    const shaftGeometry = new CylinderGeometry(0.0022, 0.0055, 1, 6, 1, true)
    // Pivot at the base so scaling the shaft grows it upward from the surface.
    shaftGeometry.translate(0, 0.5, 0)

    const ringGeometry = new RingGeometry(0.012, 0.019, 28)
    const pickGeometry = new SphereGeometry(PICK_RADIUS, 8, 6)

    for (let index = 0; index < CITIES.length; index += 1) {
      const city = CITIES[index]!
      const position = latLonToVector3(city.lat, city.lon, GLOBE_RADIUS)
      const normal = position.clone().normalize()

      const root = new Object3D()
      root.position.copy(position)
      // Orient +Y along the surface normal so the shaft stands up.
      root.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), normal)

      const shaftMaterial = new MeshBasicMaterial({
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        opacity: 0.5,
      })
      const shaft = new Mesh(shaftGeometry, shaftMaterial)
      shaft.scale.y = SHAFT_BASE_HEIGHT

      const ringMaterial = new MeshBasicMaterial({
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
        opacity: 0.4,
      })
      const ring = new Mesh(ringGeometry, ringMaterial)
      ring.rotation.x = -Math.PI / 2
      // Lift clear of the surface so the ring cannot z-fight with the sphere.
      ring.position.y = 0.0015

      const pick = new Mesh(pickGeometry, new MeshBasicMaterial({ visible: false }))
      pick.userData.cityIndex = index

      root.add(shaft, ring, pick)
      this.group.add(root)

      this.markers.push({
        index,
        root,
        shaft,
        ring,
        shaftMaterial,
        ringMaterial,
        pick,
        normal,
        activation: index === 0 ? 1 : 0,
      })
      this.pickTargets.push(pick)
    }
  }

  update(progress: number, dt: number, lambda: number, camera: Object3D, theme: Theme): void {
    const active = cityIndexForProgress(progress)
    this.accent.setRGB(theme.accent[0], theme.accent[1], theme.accent[2])

    camera.getWorldPosition(this.cameraDir)

    for (const marker of this.markers) {
      marker.activation = damp(marker.activation, marker.index === active ? 1 : 0, lambda, dt)

      // Visibility from the camera's point of view, in world space.
      this.worldNormal.copy(marker.normal).applyQuaternion(this.group.getWorldQuaternion(_q))
      const facing = this.worldNormal.dot(
        _v.copy(this.cameraDir).sub(marker.root.getWorldPosition(_p)).normalize(),
      )
      const visibility = smoothstep(-0.1, 0.25, facing)

      const activation = clamp01(marker.activation)

      marker.shaft.scale.y =
        SHAFT_BASE_HEIGHT + (SHAFT_ACTIVE_HEIGHT - SHAFT_BASE_HEIGHT) * activation
      marker.shaftMaterial.opacity = visibility * (0.26 + activation * 0.74)
      marker.ringMaterial.opacity = visibility * (0.18 + activation * 0.6)
      marker.ring.scale.setScalar(1 + activation * 0.55)

      marker.shaftMaterial.color.copy(this.accent)
      marker.ringMaterial.color.copy(this.accent)
      // Inactive markers read as neutral light; only the current one takes the
      // accent at full strength.
      if (activation < 0.99) {
        marker.shaftMaterial.color.lerp(_white, 1 - activation)
        marker.ringMaterial.color.lerp(_white, 1 - activation)
      }

      // Fully transparent markers still cost a draw call; skip them.
      marker.root.visible = visibility > 0.002
    }
  }

  /**
   * Screen positions of every marker, for the verification harness.
   *
   * The brief requires that clicking each globe marker lands inside its own
   * city, which cannot be tested without knowing where on screen they are.
   * `visible` reports whether the marker is on the near side; clicking one that
   * is not is correctly a no-op.
   */
  screenPositions(
    camera: PerspectiveCamera,
    width: number,
    height: number,
  ): Array<{ index: number; x: number; y: number; visible: boolean }> {
    return this.markers.map((marker) => {
      marker.root.getWorldPosition(_p)
      _p.project(camera)
      return {
        index: marker.index,
        x: ((_p.x + 1) / 2) * width,
        y: ((1 - _p.y) / 2) * height,
        visible: marker.root.visible,
      }
    })
  }

  /**
   * Hit-test normalised device coordinates against the markers.
   * Returns the city index, or null.
   */
  pick(ndcX: number, ndcY: number, camera: Camera): number | null {
    _ndc.set(ndcX, ndcY)
    this.raycaster.setFromCamera(_ndc, camera)
    const hits = this.raycaster.intersectObjects(this.pickTargets, false)

    for (const hit of hits) {
      const marker = this.markers[hit.object.userData.cityIndex as number]
      // Ignore markers on the far side: they are not visible, so clicking
      // through the Earth to reach one would be a surprise.
      if (marker && marker.root.visible) return marker.index
    }
    return null
  }

  dispose(): void {
    for (const marker of this.markers) {
      marker.shaftMaterial.dispose()
      marker.ringMaterial.dispose()
      ;(marker.pick.material as MeshBasicMaterial).dispose()
    }
    this.markers[0]?.shaft.geometry.dispose()
    this.markers[0]?.ring.geometry.dispose()
    this.markers[0]?.pick.geometry.dispose()
  }
}

/* Module-scope scratch objects: the update loop runs every frame for every
   marker, and allocating vectors there would churn the garbage collector. */
const _q = new Quaternion()
const _v = new Vector3()
const _p = new Vector3()
const _ndc = new Vector2()
const _white = new Color(1, 1, 1)
