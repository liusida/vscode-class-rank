# classrank README

```c++
//Should be positive:
    class public EMPTYREF_API AEmptyRefGameModeBase : public AGameModeBase
class CBOR_API FCborReader
class FMetalBlitCommandEncoderDebugging : public FMetalCommandEncoderDebugging
class FMetalSubBufferHeap
class AIMODULE_API FEQSSceneProxy final : public FDebugRenderSceneProxy
class AUDIOMIXERCORE_API FMixerNullCallback : protected FRunnable
class TLockFreeClassAllocator_TLSCache : private TLockFreeFixedSizeAllocator_TLSCache<sizeof(T), TPaddingForCacheContention, FNoopCounter , AllowDisablingOfTrim>
class FSoundFileReader final : public ISoundFileParser, public ISoundFileReader

//Should be negative:
/* AGXRHIPrivate.h: Private AGX RHI definitions. */
uint32 TableAllocSize = (Table->BlockSize > BinnedSizeLimit ? (((3 * (i - BinnedSizeLimit)) + 3)*Private::BINNED_ALLOC_POOL_SIZE) : Private::BINNED_ALLOC_POOL_SIZE);
class FNvClothErrorCallback* GNvClothErrorCallback;
	class FNvClothAssertHandler* GNvClothAssertHandler;
	class FrameProTLS;
		Class CurrentClass = self.class;
```
