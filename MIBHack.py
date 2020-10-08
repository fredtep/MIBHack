#import urllib
from bs4 import BeautifulSoup
import dryscrape
import os
import base64
import cv2
import numpy as np
import pytesseract

#To begin, we could read the bounced email and find the links

#variables :
url='file:///home/fred/Documents/programs/scripts/MainInBlack/Authentification MailInBlack anti-spam.html'

## Work only if no javascript is used
#html = urllib.request.urlopen(url).read()

#use of dryscrape to get through the javascript problem
session = dryscrape.Session()
session.visit(url)
html = session.body()

#Parse the result as HTML
soup = BeautifulSoup(html,'html.parser')

# Looking for div with class = image
div=soup.find('div',{'class':'image'})

# Getting the image tag and decoding it
image=div.find('img')
src=image['src'].replace('data:image/PNG;base64,','')
dataImg = str.encode(src) #Encode string to binary
with open("captcha.png", "wb") as fh:
    fh.write(base64.decodebytes(dataImg))

#Read the image use HSV and apply mask
img = cv2.imread('captcha.png',1)
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
#Use mask to get only the colored text
mask = cv2.inRange(hsv, (0,100,100), (255, 255, 255))
dst1 = cv2.bitwise_and(img, img, mask=mask)
#Write the image to file
cv2.imwrite("word.png", dst1)

# Read the image and OCR with pytesseract
img2 = cv2.imread('word.png')
text = pytesseract.image_to_string(img2)

print(text)

# To go further we'll have to make the robot to put the text in the form and to validate the form
