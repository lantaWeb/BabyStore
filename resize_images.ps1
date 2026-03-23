Add-Type -AssemblyName System.Drawing

$SourceDir = Join-Path $PSScriptRoot "images\products\source"
$ThumbsDir = Join-Path $PSScriptRoot "images\products\thumbs"
$FullDir   = Join-Path $PSScriptRoot "images\products\full"

$ThumbWidth = 400
$ThumbHeight = 400
$FullMaxWidth = 1400
$FullMaxHeight = 1400

$ThumbQuality = 72L
$FullQuality = 82L

$SupportedExtensions = @(".jpg", ".jpeg", ".png", ".webp")

New-Item -ItemType Directory -Force -Path $ThumbsDir | Out-Null
New-Item -ItemType Directory -Force -Path $FullDir | Out-Null

function Get-JpegCodec {
    return [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
        Where-Object { $_.MimeType -eq "image/jpeg" }
}

function Save-Jpeg($Bitmap, $OutputPath, $Quality) {
    $jpegCodec = Get-JpegCodec
    $encoder = [System.Drawing.Imaging.Encoder]::Quality
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter($encoder, $Quality)
    $Bitmap.Save($OutputPath, $jpegCodec, $encoderParams)
    $encoderParams.Dispose()
}

function New-ResizedBitmap($Image, $NewWidth, $NewHeight) {
    $Bitmap = New-Object System.Drawing.Bitmap($NewWidth, $NewHeight)
    $Graphics = [System.Drawing.Graphics]::FromImage($Bitmap)
    $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $Graphics.DrawImage($Image, 0, 0, $NewWidth, $NewHeight)
    $Graphics.Dispose()
    return $Bitmap
}

function New-CroppedThumb($Image, $TargetWidth, $TargetHeight) {
    $srcRatio = $Image.Width / $Image.Height
    $targetRatio = $TargetWidth / $TargetHeight

    if ($srcRatio -gt $targetRatio) {
        $cropHeight = $Image.Height
        $cropWidth = [int]($cropHeight * $targetRatio)
        $cropX = [int](($Image.Width - $cropWidth) / 2)
        $cropY = 0
    } else {
        $cropWidth = $Image.Width
        $cropHeight = [int]($cropWidth / $targetRatio)
        $cropX = 0
        $cropY = [int](($Image.Height - $cropHeight) / 2)
    }

    $Thumb = New-Object System.Drawing.Bitmap($TargetWidth, $TargetHeight)
    $Graphics = [System.Drawing.Graphics]::FromImage($Thumb)
    $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $destRect = New-Object System.Drawing.Rectangle(0, 0, $TargetWidth, $TargetHeight)
    $srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropWidth, $cropHeight)

    $Graphics.DrawImage($Image, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $Graphics.Dispose()

    return $Thumb
}

function Get-FitSize($Width, $Height, $MaxWidth, $MaxHeight) {
    if ($Width -le $MaxWidth -and $Height -le $MaxHeight) {
        return @{
            Width = $Width
            Height = $Height
        }
    }

    $ratioX = $MaxWidth / $Width
    $ratioY = $MaxHeight / $Height
    $ratio = [Math]::Min($ratioX, $ratioY)

    return @{
        Width = [int]($Width * $ratio)
        Height = [int]($Height * $ratio)
    }
}

Get-ChildItem -Path $SourceDir -File | Where-Object {
    $SupportedExtensions -contains $_.Extension.ToLower()
} | ForEach-Object {
    $InputFile = $_.FullName
    $BaseName = $_.BaseName

    $Image = [System.Drawing.Image]::FromFile($InputFile)

    try {
        $Thumb = New-CroppedThumb -Image $Image -TargetWidth $ThumbWidth -TargetHeight $ThumbHeight
        $ThumbOutput = Join-Path $ThumbsDir "$BaseName.jpg"
        Save-Jpeg -Bitmap $Thumb -OutputPath $ThumbOutput -Quality $ThumbQuality
        $Thumb.Dispose()

        $FullSize = Get-FitSize -Width $Image.Width -Height $Image.Height -MaxWidth $FullMaxWidth -MaxHeight $FullMaxHeight
        $FullBitmap = New-ResizedBitmap -Image $Image -NewWidth $FullSize.Width -NewHeight $FullSize.Height
        $FullOutput = Join-Path $FullDir "$BaseName.jpg"
        Save-Jpeg -Bitmap $FullBitmap -OutputPath $FullOutput -Quality $FullQuality
        $FullBitmap.Dispose()

        Write-Host "Processed: $($_.Name)"
    }
    finally {
        $Image.Dispose()
    }
}

Write-Host "Done"
